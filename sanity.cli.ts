import { defineCliConfig } from "sanity/cli";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "anvg4mk1";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  reactCompiler: { target: "19" },
  vite: {
    resolve: {
      alias: [
        {
          find: /^react-compiler-runtime$/,
          replacement: "react/compiler-runtime",
        },
      ],
    },
    optimizeDeps: { exclude: ["react-compiler-runtime"] },
  },
});
