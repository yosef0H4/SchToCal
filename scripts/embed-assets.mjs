import { readFileSync, writeFileSync } from "node:fs";

const controlsHtml = readFileSync("src/templates/controls.html", "utf8").trim();
const userCss = readFileSync("src/styles/userscript.css", "utf8").trim();

const escapeTemplateLiteral = (value) =>
  value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const output = `namespace SchMakerApp {
  export const CONTROLS_HTML = \`${escapeTemplateLiteral(controlsHtml)}\`;

  export const USERSCRIPT_CSS = \`${escapeTemplateLiteral(userCss)}\`;
}
`;

writeFileSync("src/15.assets.generated.ts", output, "utf8");
