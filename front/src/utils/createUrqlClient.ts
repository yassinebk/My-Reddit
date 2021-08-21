import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { dedupExchange, Exchange, fetchExchange, stringifyVariables } from "urql";
import Router from "next/router";
import { pipe, tap } from "wonka";
import { LoginMutation, LogoutMutation, MeDocument, MeQuery, Post, RegisterMutation } from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";


export const createUrqlClient = (ssrExchange: any) => ({
    url: "http://localhost:4000/graphql",
    fetchOptions: {
        credentials: "include" as const,
    },
    exchanges: [
        dedupExchange,
        cacheExchange({
            keys: {
                PaginatedPosts: () => null,
            },
            resolvers: {
                Query: {
                    posts: cursorPagination(),
                },
            },
            updates: {

                Mutation: {
                    login: (_result, args, cache, info) => {
                        betterUpdateQuery<LoginMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.login.errors) {
                                    return query;
                                } else {
                                    return {
                                        me: result.login?.user,
                                    };
                                }
                            }
                        );
                    },
                    register: (_result, args, cache, info) => {
                        betterUpdateQuery<RegisterMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.register.errors) {
                                    return query;
                                } else {
                                    return {
                                        me: result.register?.user,
                                    };
                                }
                            }
                        );
                    },
                    logout: (_result, args, cache, info) => {
                        betterUpdateQuery<LogoutMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            () => ({ me: null })
                        )
                    }
                },
            },
        }),

        ssrExchange, errorExchange, fetchExchange,
    ],
}
)

const errorExchange: Exchange = ({ forward }) => (ops$) => {
    return pipe(
        forward(ops$),
        tap(({ error }) => {
            if (error?.message.includes("not authenticated")) {
                Router.replace("/login")
            }
        }
        ))
}


export type MergeMode = 'before' | 'after';

export interface PaginationParams {
    limitArgument?: string;
    mergeMode?: MergeMode;
}
const cursorPagination = (): Resolver => {
    return (_parent, fieldArgs, cache, info) => {
        const { parentKey: entityKey, fieldName } = info;
        const allFields = cache.inspectFields(entityKey);
        console.log("allFields: ", allFields);
        const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
        const size = fieldInfos.length;
        if (size === 0) {
            return undefined;
        }

        const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
        const isItInTheCache = cache.resolve(cache.resolve(entityKey, fieldKey) as string, "posts");
        console.log("cache", isItInTheCache);
        info.partial = !isItInTheCache;
        const results: string[] = [];
        let hasMore = false;
        fieldInfos.forEach((fi) => {
            const key = cache.resolve(entityKey, fi.fieldKey);
            const data = cache.resolve(key as string, 'posts') as string[];
            const _hasMore = cache.resolve(key as string, 'hasMore') as string[];
            if (!_hasMore) {
                hasMore = _hasMore as boolean;
            }
            console.log('data', data);
            results.push(...data);
        });

        return {
            __typename: "PaginationPosts",
            hasMore,
            posts: results
        };
    };
};