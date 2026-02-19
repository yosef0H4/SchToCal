export type Lang = "ar" | "en";

export interface UIStrings {
  semesterStart: string;
  semesterEnd: string;
  drivingTimeTo: string;
  drivingTimeFrom: string;
  hoursPlaceholder: string;
  minutesPlaceholder: string;
  drivingEmoji: string;
  downloadIcs: string;
  guide: string;
  reset: string;
  language: string;
  alertDates: string;
  alertTable: string;
  guideTitle: string;
  guideStep1: string;
  guideStep2: string;
  guideStep3: string;
  guideStep4: string;
  guideStep5: string;
  guideClose: string;
  drivingTo: string;
  drivingFrom: string;
  ramadanMode: string;
  uploadTitle: string;
  uploadHint: string;
  uploadButton: string;
  uploadInvalid: string;
  selectedFile: string;
  noFile: string;
  generatePreview: string;
  themeTitle: string;
}

export interface ScheduleEntry {
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
}

export interface CourseSchedule {
  courseCode: string;
  courseName: string;
  activity: string;
  sectionNumber: string;
  instructor: string;
  schedule: ScheduleEntry[];
}

export interface ParseResult {
  scheduleData: CourseSchedule[];
  studentName: string;
}

export interface IcsOptions {
  semesterStart: Date;
  semesterEnd: Date;
  drivingTimeTo: number;
  drivingTimeFrom: number;
  drivingEmoji: string;
  ramadanMode: boolean;
  lang: Lang;
  courseEmojis: Record<string, string>;
}

export interface Prefs {
  lang: Lang;
  values: Record<string, string>;
  courseEmojis: Record<string, string>;
}
