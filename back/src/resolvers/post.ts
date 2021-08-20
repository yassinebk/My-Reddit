import { Arg, Ctx, Int, Query, Mutation, Resolver } from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "src/types";


@Resolver()
export class PostResolver {


    @Query(() => [Post]!)
    async posts(@Ctx() ctx: MyContext): Promise<Post[]> {
        //await sleep(5000);
        return ctx.em.find(Post, {});
    }


    @Query(() => Post, { nullable: true })
    post(
        @Arg('id', () => Int) id: number, @Ctx() { em }: MyContext
    ): Promise<Post | null> {
        console.log(id)
        return em.findOne(Post, { id });

    }

    @Mutation(() => Post)
    async createPost(
        @Arg("title", () => String) title: String,
        @Ctx() { em }: MyContext
    ): Promise<Post> {
        const post = em.create(Post, { title })
        await em.persistAndFlush(post);
        return post;
    }


    @Mutation(() => Post)
    async updatePost(
        @Arg("id") id: number,
        @Arg("title", () => String) title: string,
        @Ctx() { em }: MyContext
    ): Promise<Post | null> {
        const post = await em.findOne(Post, { id });
        if (!post) {
            return null;
        }
        if (typeof title !== "undefined") {
            post.title = title ? title : post.title;
            await em.persistAndFlush(post);
        }

        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext,
    ) {
        try {
            await em.nativeDelete(Post, { id });
        }
        catch (error) { return false; }
        return true;
    }



}