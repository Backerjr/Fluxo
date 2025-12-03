import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import type { IncomingMessage, ServerResponse } from "http";
import type { User } from "../db/schema";
import { sdk } from "./sdk";

type StandaloneContextOptions =
  NodeHTTPCreateContextFnOptions<IncomingMessage, ServerResponse>;

type ContextOptions = CreateExpressContextOptions | StandaloneContextOptions;

type RequestLike = ContextOptions["req"];
type ResponseLike = ContextOptions["res"];

export type TrpcContext = {
  req: RequestLike;
  res: ResponseLike;
  user: User | null;
};

export async function createContext(opts: ContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
