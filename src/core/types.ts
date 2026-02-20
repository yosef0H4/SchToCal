export type Lang = "ar" | "en";
export type RamadanMode = "off" | "engineering" | "firstYear";

export interface UIStrings {
  semesterStart: string;
  semesterEnd: string;
  drivingTimeTo: string;
  drivingTimeFrom: string;
  hoursPlaceholder: string;
  minutesPlaceholder: string;
  drivingEmoji: string;
  downloadIcs: string;
  downloadTampermonkey: string;
  syncGoogleCalendar: string;
  syncGoogleUnavailable: string;
  syncGoogleWorking: string;
  syncGoogleDone: string;
  syncGoogleFailed: string;
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
  ramadanSchedule: string;
  ramadanOff: string;
  ramadanEngineering: string;
  ramadanFirstYear: string;
  uploadTitle: string;
  uploadHint: string;
  uploadButton: string;
  uploadInvalid: string;
  selectedFile: string;
  noFile: string;
  generatePreview: string;
  themeTitle: string;
  settingsTitle: string;
  previewTitle: string;
  previewEmptyHint: string;
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
  ramadanMode: RamadanMode;
  lang: Lang;
  courseEmojis: Record<string, string>;
}

export interface Prefs {
  lang: Lang;
  values: Record<string, string>;
  courseEmojis: Record<string, string>;
  courseColors?: Record<string, string>;
  drivingColorId?: string;
}
