declare module "vite-plugin-manus-runtime" {
  import type { PluginOption } from "vite";

  export interface VitePluginManusRuntimeOptions {
    scriptId?: string;
    injectTo?:
      | "body"
      | "body-prepend"
      | "head"
      | "head-prepend"
      | "body-inline"
      | "head-inline";
  }

  export function vitePluginManusRuntime(
    options?: VitePluginManusRuntimeOptions
  ): PluginOption;

  export default vitePluginManusRuntime;
}

declare module "vite-plugin-manus-runtime/runtime_dist/manus-runtime.js" {
  const runtimeSource: string;
  export default runtimeSource;
}
