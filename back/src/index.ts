import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core"
import { __dev__, PORT, COOKIE_NAME } from "./constants";
import microConfig from "./mikro-orm.config"
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors"



const main = async () => {

    //sendEmail("yassinebk23@gmail.com", "hello there");
    const orm = await MikroORM.init(microConfig);
    orm.getMigrator().up();
    /* After updating the DB schema uncomment this line to initialize*/
    // orm.getSchemaGenerator().updateSchema();

    const app = express();
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true,
    }));

    const RedisStore = connectRedis(session);
    const redis =new  Redis();


    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis,
                disableTouch: true,
                disableTTL: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 15,//15 days
                httpOnly: true,
                sameSite: "lax",//CSRF,
                secure: false//cookkie only works in https
            },
            secret: "asdlfkadsdsafaksdjfdskjf",
            resave: false,
            saveUninitialized: false,
        })
    )
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false,
        }),
        debug: true,
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res,redis })
    })
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: { origin: "http://localhost:3000" }
    });

    app.get('/', (_, res) => {
        res.json('hello world');
    })
    app.listen(PORT, () => {
        console.log(`server started at ${PORT} `)
    })


}



main().catch(e => console.log(e));
