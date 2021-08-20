import { Post } from "./entities/Post"
import { User } from "./entities/User";
import { __dev__ } from "./constants";
import { MikroORM } from "@mikro-orm/core";
import path from "path";



export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]$/,
    },
    entities: [Post, User],
    dbName: "lireddit",
    user: "",
    password: "",
    debug: __dev__,
    type: "postgresql",
} as Parameters<typeof MikroORM.init>[0]
