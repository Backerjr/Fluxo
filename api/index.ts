import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const handler = createHTTPHandler({
  router: appRouter,
  path: "/api/trpc",
  createContext({ req, res }) {
    // Reuse existing context factory with the Vercel req/res shape.
    return createContext({ req: req as any, res: res as any });
  },
});

export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Basic CORS headers for browser calls; tighten as needed.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-requested-with"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  return handler(req, res);
}
