import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-loader";

const createAnalyticsScriptPlugin = (
  endpoint?: string,
  websiteId?: string
): Plugin | null => {
  if (!endpoint || !websiteId) return null;
  return {
    name: "inject-analytics-script",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: {
            src: `${endpoint.replace(/\/$/, "")}/umami`,
            defer: true,
            "data-website-id": websiteId,
            "data-analytics": "umami",
          },
          injectTo: "body",
        },
      ];
    },
  };
};

const createGoogleMapsScriptPlugin = (src?: string): Plugin | null => {
  if (!src) return null;
  return {
    name: "inject-google-maps-script",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: {
            id: GOOGLE_MAPS_SCRIPT_ID,
            src,
            async: true,
            defer: true,
            crossorigin: "anonymous",
          },
          injectTo: "body",
        },
      ];
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");

  const analyticsEndpoint = env.VITE_ANALYTICS_ENDPOINT;
  const analyticsWebsiteId = env.VITE_ANALYTICS_WEBSITE_ID;

  const forgeBaseUrl =
    env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
  const mapsApiKey = env.VITE_FRONTEND_FORGE_API_KEY;
  const mapsSrc = mapsApiKey
    ? `${forgeBaseUrl.replace(
        /\/$/,
        ""
      )}/v1/maps/proxy/maps/api/js?key=${mapsApiKey}&v=weekly&libraries=marker,places,geocoding,geometry`
    : undefined;

  const analyticsPlugin = createAnalyticsScriptPlugin(
    analyticsEndpoint,
    analyticsWebsiteId
  );
  const mapsPlugin = createGoogleMapsScriptPlugin(mapsSrc);

  const plugins = [react(), tailwindcss()];
  if (analyticsPlugin) plugins.push(analyticsPlugin);
  if (mapsPlugin) plugins.push(mapsPlugin);

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: import.meta.dirname,
    publicDir: path.resolve(import.meta.dirname, "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      allowedHosts: [
        ".manuspre.computer",
        ".manus.computer",
        ".manus-asia.computer",
        ".manuscomputer.ai",
        ".manusvm.computer",
        "localhost",
        "127.0.0.1",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
