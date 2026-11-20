import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { workersCacheCdnAdapter } from "@vinext/cloudflare/cache/workers-cache-cdn-adapter";

export default defineConfig({
  build: {
    sourcemap: false,
  },
  environments: {
    rsc: { build: { sourcemap: false } },
    ssr: { build: { sourcemap: false } },
    client: { build: { sourcemap: false } },
  },
  plugins: [
    vinext({
      cache: { cdn: workersCacheCdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
