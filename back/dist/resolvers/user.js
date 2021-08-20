"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = exports.UsernamePasswordInput = void 0;
const argon2 = __importStar(require("argon2"));
const validateRegister_1 = require("../utils/validateRegister");
const type_graphql_1 = require("type-graphql");
const constants_1 = require("../constants");
const User_1 = require("../entities/User");
const sendEmail_1 = require("../utils/sendEmail");
const uuid_1 = require("uuid");
let UsernamePasswordInput = class UsernamePasswordInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UsernamePasswordInput.prototype, "email", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UsernamePasswordInput.prototype, "username", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UsernamePasswordInput.prototype, "password", void 0);
UsernamePasswordInput = __decorate([
    type_graphql_1.InputType()
], UsernamePasswordInput);
exports.UsernamePasswordInput = UsernamePasswordInput;
let FieldError = class FieldError {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    type_graphql_1.ObjectType()
], FieldError);
let UserResponse = class UserResponse {
};
__decorate([
    type_graphql_1.Field(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    type_graphql_1.Field({ nullable: true }),
    __metadata("design:type", User_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    type_graphql_1.ObjectType()
], UserResponse);
let UserResolver = class UserResolver {
    async register(options, { em, req }) {
        const errors = validateRegister_1.validateRegister(options);
        if (errors) {
            return { errors };
        }
        const hashedPAssword = await argon2.hash(options.password);
        let user;
        try {
            const result = await em
                .createQueryBuilder(User_1.User)
                .getKnexQuery()
                .insert({
                username: options.username,
                email: options.email,
                password: hashedPAssword,
                created_at: new Date(),
                updated_at: new Date(),
            })
                .returning("*");
            user = result[0];
        }
        catch (e) {
            if (e.detail.includes("already exists")) {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "username does already exist",
                        },
                    ],
                };
            }
            else {
                console.log("error happened at resigster", e.message);
            }
        }
        req.session.userId = user.id;
        console.log("i am here", user);
        return { user };
    }
    async login(usernameOrEmail, password, { em, req }) {
        const user = await em.findOne(User_1.User, usernameOrEmail.includes("@")
            ? { email: usernameOrEmail }
            : { username: usernameOrEmail });
        console.log("user", user);
        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "that username or email doesn't exist",
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "incorrect password",
                    },
                ],
            };
        }
        req.session.userId = user.id;
        return {
            user,
        };
    }
    logout({ req, res }) {
        return new Promise((resolve) => req.session.destroy((err) => {
            res.clearCookie(constants_1.COOKIE_NAME);
            if (err) {
                console.log(err);
                resolve(false);
                return;
            }
            resolve(true);
        }));
    }
    async me({ req, em }) {
        console.log("req", req.session);
        if (!req.session.userId) {
            return null;
        }
        const user = await em.findOne(User_1.User, { id: req.session.userId });
        return user;
    }
    async forgotPassword(email, { em, redis }) {
        const user = await em.findOne(User_1.User, { email });
        if (!user) {
            return true;
        }
        const token = uuid_1.v4();
        redis.set(constants_1.FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 3);
        const resetPasswordLink = `<a href='http://localhost:3000/change-password/${token}'> resetPassword</a>`;
        sendEmail_1.sendEmail(email, resetPasswordLink);
        return true;
    }
    async changePassword(token, newPassword, { em, redis, req }) {
        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "length must be greater tha 2 "
                    }
                ]
            };
        }
        ;
        const userId = await redis.get(constants_1.FORGET_PASSWORD_PREFIX + token);
        if (!userId) {
            return {
                errors: [{
                        field: "token",
                        message: 'token expired'
                    }]
            };
        }
        ;
        const user = await em.findOne(User_1.User, { id: parseInt(userId) });
        if (!user) {
            return {
                errors: [{
                        field: "token",
                        message: 'User no longer exist'
                    }]
            };
        }
        ;
        user.password = await argon2.hash(newPassword);
        em.persistAndFlush(user);
        req.session.userId = user.id;
        return { user };
    }
};
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("options")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UsernamePasswordInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("usernameOrEmail")),
    __param(1, type_graphql_1.Arg("password")),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
__decorate([
    type_graphql_1.Query(() => User_1.User, { nullable: true }),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Arg("email")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("token")),
    __param(1, type_graphql_1.Arg('newPassword')),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
UserResolver = __decorate([
    type_graphql_1.Resolver()
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map