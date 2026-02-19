import { existsSync, readFileSync, renameSync } from "node:fs";
import { build } from "tsup";

const banner = readFileSync("src/tm/userscript.meta.txt", "utf8").trim();

await build({
  entry: ["src/tm/main.ts"],
  outDir: "dist/tm",
  format: ["iife"],
  target: "es2020",
  minify: false,
  clean: false,
  outExtension: () => ({ js: ".js" }),
  banner: { js: banner },
});

if (existsSync("dist/tm/main.js")) {
  renameSync("dist/tm/main.js", "dist/tm/script.js");
}
