"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
require("reflect-metadata");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const constants_1 = require("./constants");
const Post_1 = require("./entities/Post");
const Updoot_1 = require("./entities/Updoot");
const User_1 = require("./entities/User");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const createUpdootLoader_1 = require("./utils/createUpdootLoader");
const createUserLoader_1 = require("./utils/createUserLoader");
const main = async () => {
    const conn = await typeorm_1.createConnection({
        type: "postgres",
        database: "lireddit2",
        password: "password",
        username: "askee",
        logging: true,
        migrations: [path_1.default.join(__dirname, "./migrations/*")],
        synchronize: true,
        entities: [User_1.User, Post_1.Post, Updoot_1.Updoot],
    });
    await conn.runMigrations({ transaction: "all" });
    const app = express_1.default();
    app.use(cors_1.default({
        origin: ["http://localhost:3000", "https://studio.apollographql.com"],
        credentials: true,
    }));
    const RedisStore = connect_redis_1.default(express_session_1.default);
    const redis = new ioredis_1.default();
    app.use(express_session_1.default({
        name: constants_1.COOKIE_NAME,
        store: new RedisStore({
            client: redis,
            disableTouch: true,
            disableTTL: true,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 15,
            httpOnly: true,
            sameSite: "none",
            secure: false,
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
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: createUserLoader_1.createUserLoader(),
            updootLoader: createUpdootLoader_1.createUpdootLoader()
        }),
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: {
            origin: ["http://localhost:3000", "https://studio.apollographql.com"],
        },
    });
    app.get("/", (_, res) => {
        res.json("hello world");
    });
    app.listen(constants_1.PORT, () => {
        console.log(`server started at ${constants_1.PORT} `);
    });
};
main().catch((e) => console.log(e));
//# sourceMappingURL=index.js.map