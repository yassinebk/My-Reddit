import DataLoader from "dataloader";
import { Request, Response } from "express";
import { Redis } from "ioredis";
import { User } from "./entities/User";
import { createUpdootLoader } from "./utils/createUpdootLoader";

interface Session {
  userId?: number;
}

export type MyContext = {
  req: Request & { session: Session & Partial<Session> };
  res: Response;
  redis: Redis;
  userLoader: DataLoader<number, User, number>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
