import { Request, Response } from "express";
import { Redis } from "ioredis";

interface Session {
    userId?: number
}

export type MyContext = {
    req: Request & { session: Session & Partial<Session> },
    res: Response
    redis:Redis
}