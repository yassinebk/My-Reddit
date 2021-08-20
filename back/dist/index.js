"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@mikro-orm/core");
const constants_1 = require("./constants");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const ioredis_1 = __importDefault(require("ioredis"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const main = async () => {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    orm.getMigrator().up();
    const app = express_1.default();
    app.use(cors_1.default({
        origin: 'http://localhost:3000',
        credentials: true,
    }));
    const RedisStore = connect_redis_1.default(express_session_1.default);
    const redis = new ioredis_1.default();
    app.use(express_session_1.default({
        name: constants_1.COOKIE_NAME,
        store: new RedisStore({
            client: redis,
            disableTouch: true,
            disableTTL: true
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 15,
            httpOnly: true,
            sameSite: "lax",
            secure: false
        },
        secret: "asdlfkadsdsafaksdjfdskjf",
        resave: false,
        saveUninitialized: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await type_graphql_1.buildSchema({
            resolvers: [post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        debug: true,
        context: ({ req, res }) => ({ em: orm.em, req, res, redis })
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: { origin: "http://localhost:3000" }
    });
    app.get('/', (_, res) => {
        res.json('hello world');
    });
    app.listen(constants_1.PORT, () => {
        console.log(`server started at ${constants_1.PORT} `);
    });
};
main().catch(e => console.log(e));
//# sourceMappingURL=index.js.map