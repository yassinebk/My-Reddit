import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "src/types";
import { Arg, Int, Query, Mutation, Resolver, InputType, Field, Ctx, UseMiddleware } from "type-graphql";
import { Post } from "../entities/Post";
import { getConnection } from "typeorm";


@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}


@Resolver()
export class PostResolver {


    @Query(() => [Post]!)
    async posts(
        @Arg('limit', () => Int, { nullable: false }) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null
    ): Promise<Post[]> {
        //await sleep(5000);
        const realLimit = Math.min(50, limit);
        const qb = getConnection()
            .getRepository(Post)
            .createQueryBuilder("p")
            .orderBy('"createdAt"', 'DESC')
            .take(realLimit)
        if (cursor) {
            qb.where('"createdAt"<:cursor', { cursor: new Date(parseInt(cursor)) })
        }
        return qb.getMany();
    }


    @Query(() => Post, { nullable: true })
    post(
        @Arg('id', () => Int) id: number
    ): Promise<Post | undefined> {
        console.log(id)
        return Post.findOne({ id });

    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") options: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        if (!req.session.userId)
            throw new Error("not authenticated")
        // 2 sql queries one to save and one to selct
        return Post.create({ title: options.title, text: options.text, creatorId: req.session.userId }).save();

    }


    @Mutation(() => Post)
    async updatePost(
        @Arg("id") id: number,
        @Arg("title", () => String) title: string,
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
    async deletePost(
        @Arg("id") id: number,
    ) {
        try {
            await Post.delete(id);
        }
        catch (error) { return false; }
        return true;
    }



}