import { IDatabaseDriver, Connection, EntityManager } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Redis } from "ioredis";

interface Session {
    userId?: number
}

export type MyContext = {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
    req: Request & { session: Session & Partial<Session> },
    res: Response
    redis:Redis
}