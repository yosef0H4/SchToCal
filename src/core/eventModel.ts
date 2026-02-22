import { getAdjustedTimesInMinutes } from "./ics";
import { CourseSchedule, Lang, RamadanMode, RoomInfo } from "./types";
import { uiStrings } from "./strings";

export interface BuildSeriesOptions {
  semesterStart: Date;
  semesterEnd: Date;
  drivingTimeTo: number;
  drivingTimeFrom: number;
  drivingEmoji: string;
  ramadanMode: RamadanMode;
  lang: Lang;
  courseEmojis: Record<string, string>;
}

export interface RecurringSeries {
  id: string;
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
  summary: string;
  location?: string;
  description?: string;
  transparency?: "transparent" | "opaque";
  colorGroup?: string;
}

export const DAY_MAP: Record<number, string> = {
  1: "SU",
  2: "MO",
  3: "TU",
  4: "WE",
  5: "TH",
  6: "FR",
  7: "SA",
};

function formatDisplayLocation(room: string, roomInfo?: RoomInfo): string {
  const preferred = [roomInfo?.roomLabel, roomInfo?.buildingName].filter(Boolean).join(" ").trim();
  return preferred || room;
}

function toUtcStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export function buildRecurringSeries(
  scheduleData: CourseSchedule[],
  options: BuildSeriesOptions,
): RecurringSeries[] {
  const series: RecurringSeries[] = [];

  scheduleData.forEach((course) => {
    const sanitizedCode = course.courseCode.replace(/\s+/g, "-");
    const emoji = options.courseEmojis[sanitizedCode] ?? "📚";

    course.schedule.forEach((entry, entryIndex) => {
      if (!entry.startTime || !entry.endTime) return;

      const { start, end } = getAdjustedTimesInMinutes(
        entry.startTime,
        entry.endTime,
        options.ramadanMode,
      );

      const activityTypeEmoji =
        course.activity === "محاضرة" ? "📖" : course.activity === "تمارين" ? "🎯" : "";

      entry.days.forEach((dayStr) => {
        const dayIndex = parseInt(dayStr, 10);
        if (Number.isNaN(dayIndex) || dayIndex < 1 || dayIndex > 7) return;

        series.push({
          id: `${sanitizedCode}-${entryIndex}-${dayIndex}`,
          dayIndex,
          startMinutes: start,
          endMinutes: end,
          summary: `${`${course.courseCode} ${emoji}${activityTypeEmoji}`.trim()}`,
          location: formatDisplayLocation(entry.room, entry.roomInfo),
          description:
            `${course.courseName}\n🔢 ${course.sectionNumber}\n👨‍🏫 ${course.instructor}` +
            `\n📍 ${entry.room}`,
          transparency: "opaque",
          colorGroup: sanitizedCode,
        });
      });
    });
  });

  if (options.drivingTimeTo > 0 || options.drivingTimeFrom > 0) {
    const strings = uiStrings[options.lang];
    const dailyBounds: Record<string, { start: number; end: number }> = {};

    scheduleData.forEach((course) => {
      course.schedule.forEach((entry) => {
        const { start, end } = getAdjustedTimesInMinutes(
          entry.startTime,
          entry.endTime,
          options.ramadanMode,
        );

        entry.days.forEach((dayStr) => {
          const dayIndex = parseInt(dayStr, 10);
          if (Number.isNaN(dayIndex) || dayIndex < 1 || dayIndex > 7) return;

          const key = String(dayIndex);
          if (!dailyBounds[key]) dailyBounds[key] = { start, end };
          else {
            if (start < dailyBounds[key].start) dailyBounds[key].start = start;
            if (end > dailyBounds[key].end) dailyBounds[key].end = end;
          }
        });
      });
    });

    Object.entries(dailyBounds).forEach(([dayKey, bounds]) => {
      const dayIndex = parseInt(dayKey, 10);
      if (Number.isNaN(dayIndex) || dayIndex < 1 || dayIndex > 7) return;

      if (options.drivingTimeTo > 0) {
        series.push({
          id: `drive-to-${dayIndex}`,
          dayIndex,
          startMinutes: bounds.start - options.drivingTimeTo,
          endMinutes: bounds.start,
          summary: `${options.drivingEmoji} ${strings.drivingTo}`,
          transparency: "transparent",
          colorGroup: "driving",
        });
      }

      if (options.drivingTimeFrom > 0) {
        series.push({
          id: `drive-from-${dayIndex}`,
          dayIndex,
          startMinutes: bounds.end,
          endMinutes: bounds.end + options.drivingTimeFrom,
          summary: `${options.drivingEmoji} ${strings.drivingFrom}`,
          transparency: "transparent",
          colorGroup: "driving",
        });
      }
    });
  }

  return series;
}

export function firstOccurrenceDate(semesterStart: Date, dayIndex: number): Date {
  const dayOfWeek = dayIndex - 1;
  const first = new Date(semesterStart.getTime());
  while (first.getUTCDay() !== dayOfWeek) {
    first.setUTCDate(first.getUTCDate() + 1);
  }
  return first;
}

export function minutesToTimeParts(minutes: number): [number, number] {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  return [hour, minute];
}

export function toUntilStamp(endDate: Date): string {
  return toUtcStamp(endDate);
}
