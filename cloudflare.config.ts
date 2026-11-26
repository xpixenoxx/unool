import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const cache = await createWorkersCacheConfig();

export default defineConfig({
  accountId: "df0d56739b21ba2234a5eac43ea02c60",
  worker: defineWorker({
    ...cache,
    name: "unool",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-20",
    compatibilityFlags: ["nodejs_compat"],
    placement: {
      mode: "smart",
    },
    observability: {
      enabled: true,
      headSamplingRate: 1,
      logs: {
        enabled: true,
        headSamplingRate: 1,
        invocationLogs: true,
        persist: true,
      },
      traces: {
        enabled: true,
        headSamplingRate: 0.2,
        persist: true,
      },
    },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ...cache.env,
      ASSETS: bindings.assets(),
      UNOOL_EDGE_KV: bindings.kv({ id: "8c835d0ac38f4e11af7b1010329119b6" }),
      AI: bindings.ai(),
      AVATARS_BUCKET: bindings.r2({ name: "avatars" }),
      POST_MEDIA_BUCKET: bindings.r2({ name: "post-media" }),
    },
  }),
});
