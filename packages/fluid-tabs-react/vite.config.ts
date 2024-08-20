/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),

    cssInjectedByJsPlugin(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./setupTests.ts",
  },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.ts"),
      name: "FluidTabsReact",
      fileName: "fluid-tabs-react",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "animated-scroll-to",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "animated-scroll-to": "animateScrollTo",
        },
      },
    },
  },
});
