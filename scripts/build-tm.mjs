import { existsSync, readFileSync, renameSync, copyFileSync, mkdirSync } from "node:fs";
import { build } from "tsup";

const banner = readFileSync("src/tm/userscript.meta.txt", "utf8").trim();

await build({
  entry: ["src/tm/main.ts"],
  outDir: "dist/tm",
  format: ["iife"],
  target: "es2020",
  minify: false,
  clean: false,
  outExtension: () => ({ js: ".user.js" }),
  banner: { js: banner },
});

if (existsSync("dist/tm/main.user.js")) {
  renameSync("dist/tm/main.user.js", "dist/tm/schmaker.user.js");
}

// Copy to public folder for dev mode and dist/web for production
if (existsSync("dist/tm/schmaker.user.js")) {
  mkdirSync("public", { recursive: true });
  copyFileSync("dist/tm/schmaker.user.js", "public/schmaker.user.js");
  console.log("Copied schmaker.user.js to public/");
}
