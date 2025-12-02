import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import type { IncomingMessage, ServerResponse } from "http";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const handler = createHTTPHandler({
  router: appRouter,
  // Match the tRPC endpoint path so requests like
  // /api/trpc/system.health correctly resolve on Vercel
  basePath: "/api/trpc/",
  createContext({ req, res }) {
    return createContext({ req: req as any, res: res as any });
  },
});

export default async function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse
) {
  // Basic CORS headers for browser calls; tighten as needed.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-requested-with"
  );

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  return handler(req, res);
}
