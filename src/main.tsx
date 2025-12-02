import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

declare global {
  interface Window {
    __MANUS_HOST_DEV__?: boolean;
    __manusRuntimeReady?: Promise<unknown>;
  }
}

const ensureManusRuntime = async () => {
  if (typeof window === "undefined") return;

  if (window.__MANUS_HOST_DEV__ === undefined) {
    window.__MANUS_HOST_DEV__ = import.meta.env.DEV;
  }

  if (!window.__manusRuntimeReady) {
    window.__manusRuntimeReady = import(
      "vite-plugin-manus-runtime/runtime_dist/manus-runtime.js"
    );
  }

  await window.__manusRuntimeReady;
};

const queryClient = new QueryClient();

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // In browser, use current origin with /api/trpc path
    return `${window.location.origin}/api/trpc`;
  }
  // Fallback for SSR or build time (should not reach here in client-only app)
  return "/api/trpc";
};

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getApiUrl(),
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const bootstrap = async () => {
  await ensureManusRuntime();

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StrictMode>
          <App />
        </StrictMode>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

bootstrap();
