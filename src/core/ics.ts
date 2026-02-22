import { uiStrings } from "./strings";
import { CourseSchedule, IcsOptions, RamadanMode, RoomInfo } from "./types";

function toIcsDate(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function convertTo24Hour(h: number, m: number, period: string): [number, number] {
  let hour = h;
  if (period.includes("م") && h !== 12) hour += 12;
  if (period.includes("ص") && h === 12) hour = 0;
  return [hour, m];
}

function durationMinutes(startTotal: number, endTotal: number): number {
  return endTotal >= startTotal ? endTotal - startTotal : endTotal + 1440 - startTotal;
}

export function getAdjustedTimesInMinutes(
  startStr: string,
  endStr: string,
  ramadanMode: RamadanMode,
): { start: number; end: number } {
  const sMatches = startStr.match(/\d+/g);
  const eMatches = endStr.match(/\d+/g);
  if (!sMatches || !eMatches || sMatches.length < 2 || eMatches.length < 2) {
    return { start: 0, end: 0 };
  }

  const [sH, sM] = sMatches.map(Number);
  const [eH, eM] = eMatches.map(Number);
  const [sHour, sMin] = convertTo24Hour(sH, sM, startStr);
  const [eHour, eMin] = convertTo24Hour(eH, eM, endStr);

  let startTotal = sHour * 60 + sMin;
  let endTotal = eHour * 60 + eMin;

  if (ramadanMode !== "off") {
    const engineeringStarts: Record<number, number> = {
      8: 10 * 60,
      9: 10 * 60 + 40,
      10: 11 * 60 + 20,
      11: 12 * 60 + 30,
      13: 13 * 60 + 10,
      14: 13 * 60 + 50,
      15: 14 * 60 + 30,
      16: 15 * 60 + 10,
    };

    const firstYearStarts: Record<number, number> = {
      13: 21 * 60 + 30,
      14: 22 * 60 + 10,
      15: 22 * 60 + 50,
      16: 23 * 60 + 30,
      // After midnight slots continue into the next day.
      17: 24 * 60 + 10,
      18: 24 * 60 + 50,
      19: 25 * 60 + 30,
    };

    const mappedStart =
      ramadanMode === "engineering" ? engineeringStarts[sHour] : firstYearStarts[sHour];

    if (mappedStart !== undefined) {
      const originalDuration = durationMinutes(startTotal, endTotal);
      const ramadanDuration = Math.round(originalDuration * 0.7);
      startTotal = mappedStart;
      endTotal = mappedStart + ramadanDuration;
    }
  }

  if (ramadanMode === "off" && endTotal <= startTotal) {
    endTotal += 1440;
  }

  return { start: startTotal, end: endTotal };
}

function toIcsLocalDateTimeParts(baseDate: Date, totalMinutes: number): { datePart: string; timePart: string } {
  const d = new Date(baseDate.getTime());
  if (totalMinutes < 0 || totalMinutes >= 1440) {
    const dayShift = Math.floor(totalMinutes / 1440);
    d.setUTCDate(d.getUTCDate() + dayShift);
  }

  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const datePart = `${d.getUTCFullYear()}${(d.getUTCMonth() + 1).toString().padStart(2, "0")}${d
    .getUTCDate()
    .toString()
    .padStart(2, "0")}`;
  const timePart = `${hour.toString().padStart(2, "0")}${minute.toString().padStart(2, "0")}00`;

  return { datePart, timePart };
}

function formatDisplayLocation(room: string, roomInfo?: RoomInfo): string {
  if (roomInfo?.roomLabel && roomInfo?.buildingName) {
    return `${roomInfo.roomLabel} ${roomInfo.buildingName}`;
  }
  if (roomInfo?.roomLabel && roomInfo?.buildingCode) {
    return `${roomInfo.roomLabel} ${roomInfo.buildingCode}`;
  }
  return room;
}

export function generateIcs(scheduleData: CourseSchedule[], options: IcsOptions): string {
  const strings = uiStrings[options.lang];

  const dayMap: Record<string, string> = {
    "1": "SU",
    "2": "MO",
    "3": "TU",
    "4": "WE",
    "5": "TH",
    "6": "FR",
    "7": "SA",
  };

  const icsEvents: string[] = [];

  scheduleData.forEach((course) => {
    const sanitizedCode = course.courseCode.replace(/\s+/g, "-");
    const emoji = options.courseEmojis[sanitizedCode] ?? "📚";

    course.schedule.forEach((entry) => {
      if (!entry.startTime || !entry.endTime) return;

      const { start: startTotalMins, end: endTotalMins } = getAdjustedTimesInMinutes(
        entry.startTime,
        entry.endTime,
        options.ramadanMode,
      );

      entry.days.forEach((dayIndex) => {
        if (!dayMap[dayIndex]) return;

        const dayOfWeek = parseInt(dayIndex, 10) - 1;
        const firstEventDate = new Date(options.semesterStart.getTime());
        while (firstEventDate.getUTCDay() !== dayOfWeek) {
          firstEventDate.setUTCDate(firstEventDate.getUTCDate() + 1);
        }

        const startParts = toIcsLocalDateTimeParts(firstEventDate, startTotalMins);
        const endParts = toIcsLocalDateTimeParts(firstEventDate, endTotalMins);
        const activityTypeEmoji =
          course.activity === "محاضرة" ? "📖" : course.activity === "تمارين" ? "🎯" : "";

        icsEvents.push(
          [
            "BEGIN:VEVENT",
            `DTSTAMP:${toIcsDate(new Date())}`,
            `UID:${sanitizedCode}-${entry.days.join("")}-${Date.now()}${Math.random()}`,
            `DTSTART;TZID=Asia/Riyadh:${startParts.datePart}T${startParts.timePart}`,
            `DTEND;TZID=Asia/Riyadh:${endParts.datePart}T${endParts.timePart}`,
            `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(options.semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
            `SUMMARY:${`${course.courseCode} ${emoji}${activityTypeEmoji}`.trim()}`,
            `LOCATION:${formatDisplayLocation(entry.room, entry.roomInfo)}`,
            `DESCRIPTION:${course.courseName}\\n🔢 ${course.sectionNumber}\\n👨‍🏫 ${course.instructor}\\n📍 ${entry.room}`,
            "END:VEVENT",
          ].join("\n"),
        );
      });
    });
  });

  if (options.drivingTimeTo > 0 || options.drivingTimeFrom > 0) {
    const dailyBounds: Record<string, { start: number; end: number }> = {};

    scheduleData.forEach((course) => {
      course.schedule.forEach((entry) => {
        const { start, end } = getAdjustedTimesInMinutes(
          entry.startTime,
          entry.endTime,
          options.ramadanMode,
        );

        entry.days.forEach((dayIndex) => {
          if (!dailyBounds[dayIndex]) dailyBounds[dayIndex] = { start, end };
          else {
            if (start < dailyBounds[dayIndex].start) dailyBounds[dayIndex].start = start;
            if (end > dailyBounds[dayIndex].end) dailyBounds[dayIndex].end = end;
          }
        });
      });
    });

    Object.keys(dailyBounds).forEach((dayIndex) => {
      const bounds = dailyBounds[dayIndex];
      const dayOfWeek = parseInt(dayIndex, 10) - 1;
      const firstEventDate = new Date(options.semesterStart.getTime());
      while (firstEventDate.getUTCDay() !== dayOfWeek) {
        firstEventDate.setUTCDate(firstEventDate.getUTCDate() + 1);
      }

      const createDrivingEvent = (
        title: string,
        baseTimeMinutes: number,
        offsetMinutes: number,
        isDrivingTo: boolean,
      ): void => {
        if (offsetMinutes <= 0) return;

        const startTime = new Date(firstEventDate.getTime());
        const endTime = new Date(firstEventDate.getTime());

        if (isDrivingTo) {
          startTime.setUTCHours(0, baseTimeMinutes - offsetMinutes, 0, 0);
          endTime.setUTCHours(0, baseTimeMinutes, 0, 0);
        } else {
          startTime.setUTCHours(0, baseTimeMinutes, 0, 0);
          endTime.setUTCHours(0, baseTimeMinutes + offsetMinutes, 0, 0);
        }

        const formatDate = (d: Date): string =>
          `${d.getUTCFullYear()}${(d.getUTCMonth() + 1)
            .toString()
            .padStart(2, "0")}${d.getUTCDate().toString().padStart(2, "0")}`;
        const formatTime = (d: Date): string =>
          `${d.getUTCHours().toString().padStart(2, "0")}${d
            .getUTCMinutes()
            .toString()
            .padStart(2, "0")}00`;

        icsEvents.push(
          [
            "BEGIN:VEVENT",
            `DTSTAMP:${toIcsDate(new Date())}`,
            `UID:DRIVING-${dayIndex}-${isDrivingTo ? "TO" : "FROM"}-${Date.now()}`,
            `DTSTART;TZID=Asia/Riyadh:${formatDate(startTime)}T${formatTime(startTime)}`,
            `DTEND;TZID=Asia/Riyadh:${formatDate(endTime)}T${formatTime(endTime)}`,
            `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(options.semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
            `SUMMARY:${options.drivingEmoji} ${title}`,
            "TRANSP:TRANSPARENT",
            "END:VEVENT",
          ].join("\n"),
        );
      };

      createDrivingEvent(strings.drivingTo, bounds.start, options.drivingTimeTo, true);
      createDrivingEvent(strings.drivingFrom, bounds.end, options.drivingTimeFrom, false);
    });
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScheduleTools//Schedule to ICS//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Riyadh",
    "BEGIN:STANDARD",
    "DTSTART:19700101T030000",
    "TZOFFSETFROM:+0300",
    "TZOFFSETTO:+0300",
    "TZNAME:AST",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...icsEvents,
    "END:VCALENDAR",
  ].join("\n");
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
