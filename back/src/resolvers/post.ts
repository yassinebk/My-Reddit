import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../types";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginationPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field(() => Boolean)
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50) + ". . . ";
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }
    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });
    return updoot ? updoot.value : null;
  }

  @Query(() => PaginationPosts)
  async posts(
    @Arg("limit", () => Int, { nullable: false }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
  ): Promise<PaginationPosts> {
    //await sleep(5000);
    const realLimit = Math.min(50, limit);
    console.log(realLimit);
    const realLimitPlusOne = realLimit + 1;

    //we will fetch one post more if the operation succeeds we got more posts in the db
    const replacements: any = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }
    console.log('cursor', cursor);
    console.log('replacements', replacements);


    const posts = await getConnection().query(
      `
            SELECT p.* 
             FROM post p
            ${cursor ? 'WHERE p."createdAt"< $2' : ""}
            ORDER BY p."createdAt" DESC 
            LIMIT $1
            `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === limit + 1,
    };
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    console.log("id", id);
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") options: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    if (!req.session.userId) throw new Error("not authenticated");
    // 2 sql queries one to save and one to selct
    return Post.create({
      title: options.title,
      text: options.text,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string,
    @Arg("text", () => String) text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    const { raw } = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where(`id= :id AND "creatorId"= :creatorId`, {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();
    return raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int, { nullable: false }) id: number,
    @Ctx() { req }: MyContext
  ) {
    const post = await Post.findOne(id);
    if (!post) {
      return false;
    }
    if (post.creatorId !== req.session.userId) {
      throw new Error("unauthorized access");
    }
    try {
      await Post.delete({ id, creatorId: req.session.userId });
    } catch (error) {
      return false;
    }
    return true;
  }

  @Mutation(() => Boolean)
  async vote(
    @Arg("value", () => Int, { nullable: false }) value: number,
    @Arg("postId", () => Int, { nullable: false }) postId: number,
    @Ctx() { req }: MyContext
  ) {
    const realValue = value !== -1 ? 1 : -1;
    console.log("realValue:", realValue);

    const { userId } = req.session;

    if (!userId) return false;

    const updoot = await Updoot.findOne({ where: { postId, userId } });
    console.log("updoot", updoot);

    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        UPDATE updoot
        SET value =$1
        WHERE "postId" = $2 and "userId"= $3
        `,
          [realValue, postId, userId]
        );
        await tm.query(
          `
        UPDATE post
        SET points = points + $1
        WHERE id = $2`,
          [2 * realValue, postId]
        );
      });
      return true;
    } else if (!updoot) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
            insert into updoot ("userId", "postId", value)
            values ($1,$2,$3);
        `,
          [userId, postId, realValue]
        );
        await tm.query(
          `
        update post
        set points = points + $1
        where id = $2;
        `,
          [realValue, postId]
        );
      });
      return true;
    } else {
      return false;
    }
    return true;
  }
}
