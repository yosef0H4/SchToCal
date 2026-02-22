import { CourseSchedule, ParseResult, RoomInfo, ScheduleEntry } from "./types";

const BUILDING_NAME_BY_CODE: Record<string, string> = {
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

function parseRoomInfo(rawRoom: string): RoomInfo {
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
    const roomNumber = roomToken.match(/(\d+)$/)?.[1];
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

export function parseScheduleFromDocument(doc: Document): ParseResult | null {
  const scheduleTable = doc.getElementById("myForm:studScheduleTable");
  if (!scheduleTable) return null;

  const scheduleData: CourseSchedule[] = [];
  const rows = scheduleTable.querySelectorAll<HTMLTableRowElement>("tbody > tr");

  rows.forEach((row) => {
    const cells = row.children;
    if (cells.length < 7) return;

    const courseCode = cells[0]?.textContent?.trim().split("\n")[0] ?? "";
    const courseName = cells[1]?.textContent?.trim() ?? "";
    const activity = cells[2]?.textContent?.trim() ?? "";
    const sectionNumber = cells[3]?.textContent?.trim() ?? "";
    const instructor =
      row.querySelector<HTMLInputElement>('input[id*=":instructor"]')?.value ??
      "N/A";
    const rawSectionValue =
      row.querySelector<HTMLInputElement>('input[id*=":section"]')?.value ?? "";

    const scheduleEntries: ScheduleEntry[] = rawSectionValue
      .split("@n")
      .map((entry) => {
        const dayPart = (entry.split("@t")[0] ?? "").trim().replace(/\s+/g, " ");
        const timePart = (entry.split("@t")[1]?.split("@r")[0] ?? "").trim();
        const roomPart = (entry.split("@r")[1] ?? "").trim();
        const [startTime = "", endTime = ""] = timePart.split(" - ");
        const days = dayPart.split(" ").filter((d) => d.trim() !== "");
        return { days, startTime, endTime, room: roomPart, roomInfo: parseRoomInfo(roomPart) };
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

  const studentName =
    doc.getElementById("studNameText")?.textContent?.trim() || "Student";

  return { scheduleData, studentName };
}

export function parseScheduleFromHtml(html: string): ParseResult | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return parseScheduleFromDocument(doc);
}
