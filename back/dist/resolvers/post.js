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
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const Post_1 = require("../entities/Post");
const Updoot_1 = require("../entities/Updoot");
const isAuth_1 = require("../middlewares/isAuth");
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
    async posts(limit, cursor, { req }) {
        const realLimit = Math.min(50, limit);
        console.log(realLimit);
        const realLimitPlusOne = realLimit + 1;
        const replacements = [realLimitPlusOne];
        if (req.session.userId) {
            console.log("session.userId", req.session.userId);
            replacements.push(req.session.userId);
        }
        let cursorIndex = 3;
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
            cursorIndex = replacements.length;
        }
        const posts = await typeorm_1.getConnection().query(`
            SELECT p.* ,
            json_build_object(
                'username',u.username,
                'id',u.id,
                'email',u.email,
                'createdAt',u."createdAt",
                'updatedAt',u."updatedAt"
                ) creator , 
                ${req.session.userId
            ? `(SELECT value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"`
            : `null as "voteStatus"`}
             FROM post p
            INNER JOIN public.user u on u.id=p."creatorId"
            ${cursor ? `WHERE p."createdAt"< $${cursorIndex}` : ""}
            ORDER BY p."createdAt" DESC 
            LIMIT $1
            `, replacements);
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === limit + 1,
        };
    }
    async post(id) {
        console.log("id", id);
        const post = await Post_1.Post.findOne(id, { relations: ["creator"] });
        console.log("post", post);
        return post;
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
    async updatePost(id, title, text, { req }) {
        const post = await Post_1.Post.findOne(id);
        if (!post) {
            return null;
        }
        const { raw } = await typeorm_1.getConnection()
            .createQueryBuilder()
            .update(Post_1.Post)
            .set({ title, text })
            .where(`id= :id AND "creatorId"= :creatorId`, {
            id,
            creatorId: req.session.userId,
        })
            .returning("*")
            .execute();
        return raw[0];
    }
    async deletePost(id, { req }) {
        const post = await Post_1.Post.findOne(id);
        if (!post) {
            return false;
        }
        if (post.creatorId !== req.session.userId) {
            throw new Error("unauthorized access");
        }
        try {
            await Post_1.Post.delete({ id, creatorId: req.session.userId });
        }
        catch (error) {
            return false;
        }
        return true;
    }
    async vote(value, postId, { req }) {
        const realValue = value !== -1 ? 1 : -1;
        console.log("realValue:", realValue);
        const { userId } = req.session;
        if (!userId)
            return false;
        const updoot = await Updoot_1.Updoot.findOne({ where: { postId, userId } });
        console.log("updoot", updoot);
        if (updoot && updoot.value !== realValue) {
            await typeorm_1.getConnection().transaction(async (tm) => {
                await tm.query(`
        UPDATE updoot
        SET value =$1
        WHERE "postId" = $2 and "userId"= $3
        `, [realValue, postId, userId]);
                await tm.query(`
        UPDATE post
        SET points = points + $1
        WHERE id = $2`, [2 * realValue, postId]);
            });
            return true;
        }
        else if (!updoot) {
            await typeorm_1.getConnection().transaction(async (tm) => {
                await tm.query(`
            insert into updoot ("userId", "postId", value)
            values ($1,$2,$3);
        `, [userId, postId, realValue]);
                await tm.query(`
        update post
        set points = points + $1
        where id = $2;
        `, [realValue, postId]);
            });
            return true;
        }
        else {
            return false;
        }
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
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
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
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("title", () => String)),
    __param(2, type_graphql_1.Arg("text", () => String)),
    __param(3, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int, { nullable: false })),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
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