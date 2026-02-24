#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const BUILDING_NAME_BY_CODE = {
  "5": "البرنامج الموحد (السنة التحضيرية)",
  "33": "الهندسة",
  "34": "العلوم الطبية التطبيقية",
  "35": "إدارة الاعمال",
  "36": "العلوم والدراسات الانسانية",
  "54": "هندسة وعلوم الحاسب",
  "55": "الطب",
  "62": "الصيدلة",
  "63": "طب الاسنان",
  "49": "التربية",
};

function parseRoomInfo(rawRoom) {
  const raw = rawRoom.trim();

  const dashMatch = raw.match(/^(\d+)\s*-\s*(\d+)\s+([A-Za-z])\s+(\d+)$/);
  if (dashMatch) {
    const [, buildingCode, floor, wingRaw, roomNumber] = dashMatch;
    const wing = wingRaw.toUpperCase();
    return {
      raw,
      format: "dash",
      buildingCode,
      buildingName: BUILDING_NAME_BY_CODE[buildingCode],
      floor,
      wing,
      roomNumber,
      roomLabel: `${wing}${roomNumber}`,
    };
  }

  const spaceMatch = raw.match(/^(\d+)\s+(\d+)\s+(\d+)\s+([A-Za-z])\s+([A-Za-z]?\d+)$/);
  if (spaceMatch) {
    const [, buildingCode, blockCode, floor, wingRaw, roomTokenRaw] = spaceMatch;
    const wing = wingRaw.toUpperCase();
    const roomToken = roomTokenRaw.toUpperCase();
    const roomNumberMatch = roomToken.match(/(\d+)$/);
    const roomNumber = roomNumberMatch ? roomNumberMatch[1] : undefined;
    return {
      raw,
      format: "space",
      buildingCode,
      buildingName: BUILDING_NAME_BY_CODE[buildingCode],
      blockCode,
      floor,
      wing,
      roomNumber,
      roomLabel: roomToken.startsWith(wing) ? roomToken : `${wing}${roomToken}`,
    };
  }

  return { raw, format: "unknown" };
}

function parseScheduleFromDocument(doc) {
  const scheduleTable = doc.getElementById("myForm:studScheduleTable");
  if (!scheduleTable) return null;

  const scheduleData = [];
  const rows = scheduleTable.querySelectorAll("tbody > tr");

  rows.forEach((row) => {
    const cells = row.children;
    if (cells.length < 7) return;

    const courseCode = cells[0]?.textContent?.trim().split("\n")[0] ?? "";
    const courseName = cells[1]?.textContent?.trim() ?? "";
    const activity = cells[2]?.textContent?.trim() ?? "";
    const sectionNumber = cells[3]?.textContent?.trim() ?? "";
    const instructor = row.querySelector('input[id*=":instructor"]')?.value ?? "N/A";
    const rawSectionValue = row.querySelector('input[id*=":section"]')?.value ?? "";

    const scheduleEntries = rawSectionValue
      .split("@n")
      .map((entry) => {
        const dayPart = (entry.split("@t")[0] ?? "").trim().replace(/\s+/g, " ");
        const timePart = (entry.split("@t")[1]?.split("@r")[0] ?? "").trim();
        const roomPart = (entry.split("@r")[1] ?? "").trim();
        const [startTime = "", endTime = ""] = timePart.split(" - ");
        const days = dayPart.split(" ").filter((d) => d.trim() !== "");
        return {
          days,
          startTime,
          endTime,
          room: roomPart,
          roomInfo: parseRoomInfo(roomPart),
        };
      })
      .filter((entry) => entry.days.length > 0);

    scheduleData.push({
      courseCode,
      courseName,
      activity,
      sectionNumber,
      instructor,
      schedule: scheduleEntries,
    });
  });

  const studentName = doc.getElementById("studNameText")?.textContent?.trim() || "Student";
  return { scheduleData, studentName };
}

function parseScheduleFromHtml(html) {
  const dom = new JSDOM(html);
  return parseScheduleFromDocument(dom.window.document);
}

function convertTo24Hour(h, m, period) {
  let hour = h;
  if (period.includes("م") && h !== 12) hour += 12;
  if (period.includes("ص") && h === 12) hour = 0;
  return [hour, m];
}

function durationMinutes(startTotal, endTotal) {
  return endTotal >= startTotal ? endTotal - startTotal : endTotal + 1440 - startTotal;
}

const ENGINEERING_RAMADAN_STARTS = {
  8: 10 * 60,
  9: 10 * 60 + 40,
  10: 11 * 60 + 20,
  11: 12 * 60 + 30,
  13: 13 * 60 + 10,
  14: 13 * 60 + 50,
  15: 14 * 60 + 30,
  16: 15 * 60 + 10,
  17: 21 * 60 + 30,
  18: 22 * 60 + 10,
  19: 22 * 60 + 50,
  20: 23 * 60 + 30,
  21: 24 * 60 + 10,
  22: 24 * 60 + 50,
};

const ENGINEERING_RAMADAN_SLOTS = [
  { start: 10 * 60, end: 10 * 60 + 35 },
  { start: 10 * 60 + 40, end: 10 * 60 + 75 },
  { start: 11 * 60 + 20, end: 11 * 60 + 55 },
  { start: 12 * 60 + 30, end: 13 * 60 + 5 },
  { start: 13 * 60 + 10, end: 13 * 60 + 45 },
  { start: 13 * 60 + 50, end: 14 * 60 + 25 },
  { start: 14 * 60 + 30, end: 15 * 60 + 5 },
  { start: 15 * 60 + 10, end: 15 * 60 + 45 },
  { start: 21 * 60 + 30, end: 22 * 60 + 5 },
  { start: 22 * 60 + 10, end: 22 * 60 + 45 },
  { start: 22 * 60 + 50, end: 23 * 60 + 25 },
  { start: 23 * 60 + 30, end: 24 * 60 + 5 },
  { start: 24 * 60 + 10, end: 24 * 60 + 45 },
  { start: 24 * 60 + 50, end: 25 * 60 + 25 },
];

function projectedEngineeringEnd(mappedStart, originalDuration) {
  const ORIGINAL_SLOT_MINUTES = 50;
  const slotCount =
    originalDuration % ORIGINAL_SLOT_MINUTES === 0
      ? Math.max(1, originalDuration / ORIGINAL_SLOT_MINUTES)
      : Math.max(1, Math.ceil(originalDuration / ORIGINAL_SLOT_MINUTES));
  const startIdx = ENGINEERING_RAMADAN_SLOTS.findIndex((slot) => slot.start === mappedStart);
  if (startIdx === -1) {
    const teaching = slotCount * 35;
    const breaks = (slotCount - 1) * 5;
    return mappedStart + teaching + breaks;
  }
  const endIdx = Math.min(ENGINEERING_RAMADAN_SLOTS.length - 1, startIdx + slotCount - 1);
  return ENGINEERING_RAMADAN_SLOTS[endIdx].end;
}

function formatMinutes(totalMinutes) {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  const dayShift = Math.floor(totalMinutes / 1440);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return dayShift > 0 ? `${hh}:${mm} (+${dayShift}d)` : `${hh}:${mm}`;
}

function getAdjustedTimesInMinutes(startStr, endStr, ramadanMode) {
  const sMatches = startStr.match(/\d+/g);
  const eMatches = endStr.match(/\d+/g);
  if (!sMatches || !eMatches || sMatches.length < 2 || eMatches.length < 2) {
    return { start: 0, end: 0, applied: false };
  }

  const [sH, sM] = sMatches.map(Number);
  const [eH, eM] = eMatches.map(Number);
  const [sHour, sMin] = convertTo24Hour(sH, sM, startStr);
  const [eHour, eMin] = convertTo24Hour(eH, eM, endStr);

  let startTotal = sHour * 60 + sMin;
  let endTotal = eHour * 60 + eMin;
  let applied = false;

  if (ramadanMode !== "off") {
    const mappedStart = ENGINEERING_RAMADAN_STARTS[sHour];
    if (mappedStart !== undefined) {
      const originalDuration = durationMinutes(startTotal, endTotal);
      startTotal = mappedStart;
      endTotal = projectedEngineeringEnd(mappedStart, originalDuration);
      applied = true;
    }
  }

  if (ramadanMode === "off" && endTotal <= startTotal) {
    endTotal += 1440;
  }

  return { start: startTotal, end: endTotal, applied };
}

function printUsage() {
  console.log("Usage: node scripts/parse-html-cli.mjs <file.html> [--json] [--ramadan=engineering|off]");
  console.log("\nOptions:");
  console.log("  --json    Print JSON for all detected subjects/classes.");
  console.log("  --ramadan Apply Ramadan time adjustment mode. Supported: engineering, off.");
}

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const ramadanArg = args.find((arg) => arg.startsWith("--ramadan="));
const ramadanModeRaw = ramadanArg ? ramadanArg.split("=")[1] : "off";
const ramadanMode = ramadanModeRaw === "engineering" ? "engineering" : "off";
const positional = args.filter((arg) => !arg.startsWith("--"));

if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
  printUsage();
  process.exit(args.length === 0 ? 1 : 0);
}

if (positional.length !== 1) {
  console.error("Error: Provide exactly one HTML file path.");
  printUsage();
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), positional[0]);
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

const html = fs.readFileSync(filePath, "utf8");
const parsed = parseScheduleFromHtml(html);

if (!parsed) {
  console.error("Error: Could not find schedule table '#myForm:studScheduleTable' in the HTML.");
  process.exit(2);
}

if (jsonMode) {
  const subjects = parsed.scheduleData.map((course) => ({
    courseCode: course.courseCode,
    courseName: course.courseName,
    activity: course.activity,
    sectionNumber: course.sectionNumber,
    instructor: course.instructor,
    classCount: course.schedule.length,
    schedule: course.schedule.map((entry) => {
      const adjusted = getAdjustedTimesInMinutes(entry.startTime, entry.endTime, ramadanMode);
      return {
        ...entry,
        ramadanMode,
        adjustedStart: formatMinutes(adjusted.start),
        adjustedEnd: formatMinutes(adjusted.end),
        ramadanApplied: adjusted.applied,
      };
    }),
  }));
  console.log(JSON.stringify({ studentName: parsed.studentName, subjects }, null, 2));
  process.exit(0);
}

console.log(`Student: ${parsed.studentName}`);
console.log(`Courses found: ${parsed.scheduleData.length}`);
console.log(`Ramadan mode: ${ramadanMode}`);
for (const [index, course] of parsed.scheduleData.entries()) {
  console.log(
    `${index + 1}. ${course.courseCode} | ${course.courseName} | section ${course.sectionNumber} | classes: ${course.schedule.length}`
  );
  course.schedule.forEach((entry, entryIndex) => {
    const adjusted = getAdjustedTimesInMinutes(entry.startTime, entry.endTime, ramadanMode);
    if (ramadanMode === "engineering") {
      console.log(
        `   - class ${entryIndex + 1}: ${entry.startTime} -> ${entry.endTime} | adjusted: ${formatMinutes(adjusted.start)} -> ${formatMinutes(adjusted.end)}${adjusted.applied ? "" : " (no mapping)"}`
      );
    }
  });
}
