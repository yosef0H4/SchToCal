import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = "SchToCal";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : "/",
  build: {
    outDir: "dist/web",
  },
});
