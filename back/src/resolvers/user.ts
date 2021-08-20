import { EntityManager } from "@mikro-orm/postgresql";
import * as argon2 from "argon2";
import { MyContext } from "../types";
import { validateRegister } from "../utils/validateRegister";
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from "type-graphql";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { User } from "../entities/User";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

@InputType()
export class UsernamePasswordInput {
    @Field()
    email?: string;
    @Field()
    username: string;
    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
    @Field({ nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {

        const errors = validateRegister(options);
        if (errors) {
            return { errors }
        }

        const hashedPAssword = await argon2.hash(options.password);
        let user;
        try {
            const result = await (em as EntityManager)
                .createQueryBuilder(User)
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
        } catch (e) {
            //duplicate username error
            if (e.detail.includes("already exists")) {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "username does already exist",
                        },
                    ],
                };
            } else {
                console.log("error happened at resigster", e.message);
            }
        }
        req.session.userId = user.id;
        console.log("i am here", user);
        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(
            User,
            usernameOrEmail.includes("@")
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail }
        );
        console.log("user", user)
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

        req.session!.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => Boolean) logout(
        @Ctx() { req, res }: MyContext
    ): Promise<boolean> {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                resolve(true);
            })
        );
    }

    @Query(() => User, { nullable: true }) async me(
        @Ctx() { req, em }: MyContext
    ) {
        //you are not logged in
        console.log("req", req.session);
        if (!req.session.userId) {
            return null;
        }
        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { em, redis }: MyContext
    ): Promise<boolean> {
        const user = await em.findOne(User, { email });
        if (!user) {
            return true;
        }
        const token = v4();
        redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 3);
        const resetPasswordLink = `<a href='http://localhost:3000/change-password/${token}'> resetPassword</a>`
        sendEmail(email, resetPasswordLink);
        return true;
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { em, redis,req }: MyContext): Promise<UserResponse> {

        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "length must be greater tha 2 "
                    }
                ]
            };
        };
        const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
        if (!userId) {
            return {
                errors: [{
                    field: "token",
                    message: 'token expired'
                }]
            };
        };

        const user = await em.findOne(User, { id: parseInt(userId) });
        if (!user) {
            return {
                errors: [{
                    field: "token",
                    message: 'User no longer exist'
                }]
            };
        };
        user.password = await argon2.hash(newPassword);
        em.persistAndFlush(user);
        req.session.userId = user.id
        return { user };
    }

}
