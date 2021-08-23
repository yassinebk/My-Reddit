import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "src/types";
import {
  Arg,
  Int,
  Query,
  Mutation,
  Resolver,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { Post } from "../entities/Post";
import { getConnection } from "typeorm";
import { User } from "../entities/User";

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

  @Query(() => PaginationPosts)
  async posts(
    @Arg("limit", () => Int, { nullable: false }) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
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

    const posts = await getConnection().query(
      `
            SELECT p.* ,
            json_build_object(
                'username',u.username,
                'id',u.id,
                'email',u.email,
                'createdAt',u."createdAt",
                'updatedAt',u."updatedAt"
                ) creator
             FROM post p
            INNER JOIN public.user u on u.id=p."creatorId"
            ${cursor ? `WHERE p."createdAt"< $2` : ""}
            ORDER BY p."createdAt" DESC 
            LIMIT $1
            `,
      replacements
    );
    console.log("posts", posts);

    /* .getRepository(Post)
        .createQueryBuilder("p")
        .innerJoinAndSelect("p.creator", "u", 'u.id=p."creatorId"')
        .orderBy('p."createdAt"', 'DESC')
        .take(realLimitPlusOne)
     if (cursor) {
        qb.where('"createdAt" < :cursor', {
            cursor: new Date(parseInt(cursor)),
        });
    }
*/

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === limit + 1,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    console.log(id);
    return Post.findOne({ id });
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
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title ? title : post.title;
      await Post.update({ id }, { title });
    }

    return post;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(@Arg("id") id: number) {
    try {
      await Post.delete(id);
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
    const { userId } = req.session;
    if (!userId) return false;

    await getConnection().query(
      `
    START TRANSACTION;
    insert into updoot ("userId", "postId", value)
    values (${userId},${postId},${realValue});
    update post
    set points = points + ${realValue}
    where id = ${postId};
    COMMIT;
    `
    );
    return true;
  }
}
