"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResolver = void 0;
const isAuth_1 = require("../middlewares/isAuth");
const type_graphql_1 = require("type-graphql");
const Post_1 = require("../entities/Post");
const typeorm_1 = require("typeorm");
let PostInput = class PostInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "text", void 0);
PostInput = __decorate([
    type_graphql_1.InputType()
], PostInput);
let PaginationPosts = class PaginationPosts {
};
__decorate([
    type_graphql_1.Field(() => [Post_1.Post]),
    __metadata("design:type", Array)
], PaginationPosts.prototype, "posts", void 0);
__decorate([
    type_graphql_1.Field(() => Boolean),
    __metadata("design:type", Boolean)
], PaginationPosts.prototype, "hasMore", void 0);
PaginationPosts = __decorate([
    type_graphql_1.ObjectType()
], PaginationPosts);
let PostResolver = class PostResolver {
    textSnippet(root) {
        return root.text.slice(0, 50) + ". . . ";
    }
    async posts(limit, cursor) {
        const realLimit = Math.min(50, limit);
        console.log(realLimit);
        const realLimitPlusOne = realLimit + 1;
        const replacements = [realLimitPlusOne];
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }
        const posts = await typeorm_1.getConnection().query(`
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
            ${cursor ? `WHERE p."createdAt"<$2` : ""}
            ORDER BY p."createdAt" DESC 
            LIMIT $1
            `, replacements);
        console.log("posts", posts);
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === limit + 1,
        };
    }
    post(id) {
        console.log(id);
        return Post_1.Post.findOne({ id });
    }
    async createPost(options, { req }) {
        if (!req.session.userId)
            throw new Error("not authenticated");
        return Post_1.Post.create({
            title: options.title,
            text: options.text,
            creatorId: req.session.userId,
        }).save();
    }
    async updatePost(id, title) {
        const post = await Post_1.Post.findOne(id);
        if (!post) {
            return null;
        }
        if (typeof title !== "undefined") {
            post.title = title ? title : post.title;
            await Post_1.Post.update({ id }, { title });
        }
        return post;
    }
    async deletePost(id) {
        try {
            await Post_1.Post.delete(id);
        }
        catch (error) {
            return false;
        }
        return true;
    }
    async vote(value, postId, { req }) {
        const realValue = value !== -1 ? 1 : -1;
        const { userId } = req.session;
        if (!userId)
            return false;
        await typeorm_1.getConnection().query(`
    START TRANSACTION;
    insert into updoot ("userId", "postId", value)
    values (${userId},${postId},${realValue});
    update post
    set points = points + ${realValue}
    where id = ${postId};
    COMMIT;
    `);
        return true;
    }
};
__decorate([
    type_graphql_1.FieldResolver(() => String),
    __param(0, type_graphql_1.Root()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textSnippet", null);
__decorate([
    type_graphql_1.Query(() => PaginationPosts),
    __param(0, type_graphql_1.Arg("limit", () => type_graphql_1.Int, { nullable: false })),
    __param(1, type_graphql_1.Arg("cursor", () => String, { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "posts", null);
__decorate([
    type_graphql_1.Query(() => Post_1.Post, { nullable: true }),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "post", null);
__decorate([
    type_graphql_1.Mutation(() => Post_1.Post),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("input")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    type_graphql_1.Mutation(() => Post_1.Post),
    __param(0, type_graphql_1.Arg("id")),
    __param(1, type_graphql_1.Arg("title", () => String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Arg("value", () => type_graphql_1.Int, { nullable: false })),
    __param(1, type_graphql_1.Arg("postId", () => type_graphql_1.Int, { nullable: false })),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
PostResolver = __decorate([
    type_graphql_1.Resolver(Post_1.Post)
], PostResolver);
exports.PostResolver = PostResolver;
//# sourceMappingURL=post.js.map