import "reflect-metadata";
import { __dev__, PORT, COOKIE_NAME } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import path from "path";
import { Updoot } from "./entities/Updoot";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "lireddit2",
    password: "password",
    username: "askee",
    logging: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    synchronize: true,
    entities: [User, Post, Updoot],
  });
  await conn.runMigrations({ transaction: "all" });
  //await Post.delete({});

  const app = express();
  app.use(
    cors({
      origin: ["http://localhost:3000", "https://studio.apollographql.com"],
      credentials: true,
    })
  );

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 15, //15 days
        httpOnly: true,
        sameSite: "none", //CSRF,
        secure: false, //cookkie only works in https
      },
      secret: "asdlfkadsdsafaksdjfdskjf",
      resave: false,
      saveUninitialized: false,
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    debug: true,
    context: ({ req, res }): MyContext => ({ req, res, redis }),
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
  app.listen(PORT, () => {
    console.log(`server started at ${PORT} `);
  });
};

main().catch((e) => console.log(e));
