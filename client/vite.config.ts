import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { viteStaticCopy } from "vite-plugin-static-copy";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    tsconfigPaths(),
    mkcert(),
    nodePolyfills({
      // Enable polyfills for Buffer and other Node.js globals
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    viteStaticCopy({
      targets: [
        {
          src: "src/assets/fonts/*",
          dest: "assets/fonts",
        },
      ],
    }),
  ],
  worker: {
    format: "es",
    plugins: () => [
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        protocolImports: true,
      }),
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Fix for pino browser compatibility
      pino: "pino/browser.js",
    },
  },
  optimizeDeps: {
    exclude: ["@aztec/bb.js", "@noir-lang/noir_js", "@noir-lang/acvm_js"],
    include: ["pino"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
