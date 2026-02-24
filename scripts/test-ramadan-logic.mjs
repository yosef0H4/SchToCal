import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const files = ["src/core/types.ts", "src/core/strings.ts", "src/core/ics.ts"];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const outPath = path.join("/tmp/ramadan-test", file.replace(/^src\//, "").replace(/\.ts$/, ".js"));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, compiled);
}

const { getAdjustedTimesInMinutes } = await import("file:///tmp/ramadan-test/core/ics.js");

function formatMinutes(totalMinutes) {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

const cases = [
  ["10:00 ص", "11:40 ص", "11:20", "13:05"],
  ["10:00 ص", "10:50 ص", "11:20", "11:55"],
  ["01:00 م", "02:40 م", "13:10", "14:25"],
  ["11:00 ص", "11:50 ص", "12:30", "13:05"],
  ["08:00 ص", "09:40 ص", "10:00", "11:15"],
  ["09:00 ص", "09:50 ص", "10:40", "11:15"],
  ["08:00 ص", "08:50 ص", "10:00", "10:35"],
  ["03:00 م", "04:40 م", "14:30", "15:45"],
];

let passed = 0;
for (const [startStr, endStr, expectedStart, expectedEnd] of cases) {
  const adjusted = getAdjustedTimesInMinutes(startStr, endStr, "engineering");
  const gotStart = formatMinutes(adjusted.start);
  const gotEnd = formatMinutes(adjusted.end);
  const ok = gotStart === expectedStart && gotEnd === expectedEnd;
  if (ok) passed += 1;
  console.log(
    `${startStr} -> ${endStr} | got ${gotStart}-${gotEnd} | expected ${expectedStart}-${expectedEnd} | ${ok ? "PASS" : "FAIL"}`,
  );
}

console.log(`RESULT: ${passed}/${cases.length} passed`);
if (passed !== cases.length) process.exit(1);
