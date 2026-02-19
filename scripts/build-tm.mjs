import { mkdirSync, readFileSync } from "node:fs";
import { build } from "esbuild";

const banner = readFileSync("src/tm/userscript.meta.txt", "utf8").trim();
mkdirSync("dist/tm", { recursive: true });

await build({
  entryPoints: ["src/tm/main.ts"],
  bundle: true,
  format: "iife",
  target: ["es2020"],
  outfile: "dist/tm/script.js",
  charset: "utf8",
  banner: { js: banner },
  legalComments: "none",
});
