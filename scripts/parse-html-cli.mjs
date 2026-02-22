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

function printUsage() {
  console.log("Usage: node scripts/parse-html-cli.mjs <file.html> [--json]");
  console.log("\nOptions:");
  console.log("  --json    Print JSON for all detected subjects/classes.");
}

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
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
    schedule: course.schedule,
  }));
  console.log(JSON.stringify({ studentName: parsed.studentName, subjects }, null, 2));
  process.exit(0);
}

console.log(`Student: ${parsed.studentName}`);
console.log(`Courses found: ${parsed.scheduleData.length}`);
for (const [index, course] of parsed.scheduleData.entries()) {
  console.log(
    `${index + 1}. ${course.courseCode} | ${course.courseName} | section ${course.sectionNumber} | classes: ${course.schedule.length}`
  );
}
