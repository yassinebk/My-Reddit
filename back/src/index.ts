import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import path from "path";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, PORT } from "./constants";
import { Post } from "./entities/Post";
import { Updoot } from "./entities/Updoot";
import { User } from "./entities/User";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { createUserLoader } from "./utils/createUserLoader";

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
  // resetting the background
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
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader:createUpdootLoader()
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
  app.listen(PORT, () => {
    console.log(`server started at ${PORT} `);
  });
};

main().catch((e) => console.log(e));
