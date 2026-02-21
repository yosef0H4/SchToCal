import { ChangeEvent, useEffect, useMemo, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import arLocale from "@fullcalendar/core/locales/ar";
import { EventContentArg, EventInput } from "@fullcalendar/core";
import { generateIcs, downloadFile, getAdjustedTimesInMinutes } from "../core/ics";
import { syncScheduleToGoogle, requestAccessToken, ensureSemesterCalendar } from "./googleCalendar";
import type { BuildSeriesOptions } from "../core/eventModel";
import { parseScheduleFromHtml } from "../core/parse";
import { uiStrings } from "../core/strings";
import { CourseSchedule, Lang, RamadanMode } from "../core/types";
import { motion, AnimatePresence } from "framer-motion";
import { theme } from "./themeConfig";
import {
  UploadCloud,
  Calendar,
  Clock,
  Car,
  Download,
  CloudUpload,
  LoaderCircle,
  Languages,
  FileCheck,
  AlertCircle,
  Eye,
  ChevronDown,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Card = ({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={cn("relative transition-all duration-500 p-6", theme.cardClass, className)}
  >
    {children}
  </motion.div>
);

const InputGroup = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label className={cn("flex items-center gap-2 text-sm font-medium", theme.subTextClass)}>
      <Icon className={cn("h-4 w-4", theme.accentColor)} />
      {label}
    </label>
    {children}
  </div>
);

const StyledInput = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full h-12 px-4 outline-none transition-all duration-300",
      theme.inputClass,
      theme.textClass,
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
  />
);

const StyledSelect = ({
  label,
  value,
  onChange,
  options,
  direction = "rtl",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  direction?: "rtl" | "ltr";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={containerRef} dir={direction}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-12 px-4 flex items-center justify-between transition-all duration-300",
          theme.inputClass.replace("focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]", ""),
          isOpen ? "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "shadow-none",
          theme.textClass
        )}
      >
        <span className="truncate">{selectedOption?.label || label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute z-50 w-full mt-1 bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden",
              theme.textClass
            )}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2 text-start transition-colors hover:bg-yellow-50",
                  value === opt.value ? "bg-yellow-100 font-bold" : ""
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

type ParseState = {
  scheduleData: CourseSchedule[];
  studentName: string;
};

const WEB_PREFS_KEY = "scheduleWebPrefs";
const GOOGLE_COLOR_OPTIONS = [
  { id: "1", labelAr: "خزامي", labelEn: "Lavender", hex: "#7986cb" },
  { id: "2", labelAr: "مريمية", labelEn: "Sage", hex: "#33b679" },
  { id: "3", labelAr: "عنب", labelEn: "Grape", hex: "#8e24aa" },
  { id: "4", labelAr: "فلامنغو", labelEn: "Flamingo", hex: "#e67c73" },
  { id: "5", labelAr: "موز", labelEn: "Banana", hex: "#f6c026" },
  { id: "6", labelAr: "يوسفي", labelEn: "Tangerine", hex: "#f4511e" },
  { id: "7", labelAr: "طاووسي", labelEn: "Peacock", hex: "#039be5" },
  { id: "8", labelAr: "جرافيت", labelEn: "Graphite", hex: "#616161" },
  { id: "9", labelAr: "توت", labelEn: "Blueberry", hex: "#3f51b5" },
  { id: "10", labelAr: "ريحان", labelEn: "Basil", hex: "#0b8043" },
  { id: "11", labelAr: "طماطم", labelEn: "Tomato", hex: "#d50000" },
] as const;
const GOOGLE_COLOR_IDS = GOOGLE_COLOR_OPTIONS.map((opt) => opt.id);
const PREFERRED_CLASS_EMOJIS = [
  "📚",
  "🖥️",
  "🌍",
  "🧪",
  "📐",
  "📈",
  "🧠",
  "💻",
  "📝",
  "🧬",
  "⚙️",
  "🏛️",
  "🔬",
  "🗣️",
  "📊",
  "🧮",
  "⚛️",
  "📖",
  "🛰️",
] as const;

function colorHexById(colorId: string): string {
  return GOOGLE_COLOR_OPTIONS.find((c) => c.id === colorId)?.hex ?? "#7986cb";
}

function isValidColorId(colorId: string): boolean {
  return GOOGLE_COLOR_IDS.includes(colorId);
}

function shuffledGoogleColorIds(): string[] {
  const shuffled = [...GOOGLE_COLOR_IDS];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function randomColorSelectionForCourses(courseKeys: string[]): { courseColors: Record<string, string>; drivingColorId: string } {
  const uniqueKeys = [...new Set(courseKeys)];
  const shuffled = shuffledGoogleColorIds();
  const courseColors: Record<string, string> = {};

  uniqueKeys.forEach((key, index) => {
    courseColors[key] = shuffled[index % shuffled.length];
  });

  const drivingColorId = shuffled[uniqueKeys.length % shuffled.length];
  return { courseColors, drivingColorId };
}

function randomEmojiSelectionForCourses(courseKeys: string[]): Record<string, string> {
  const uniqueKeys = [...new Set(courseKeys)];
  const shuffled = [...PREFERRED_CLASS_EMOJIS];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const courseEmojis: Record<string, string> = {};
  uniqueKeys.forEach((key, index) => {
    courseEmojis[key] = shuffled[index % shuffled.length];
  });

  return courseEmojis;
}

function getWeekStartSunday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function buildWeeklyPreviewEvents(
  courses: CourseSchedule[],
  courseEmojis: Record<string, string>,
  courseColors: Record<string, string>,
  drivingColorId: string,
  ramadanMode: RamadanMode,
  drivingTimeTo: number,
  drivingTimeFrom: number,
  drivingEmoji: string,
  drivingToLabel: string,
  drivingFromLabel: string,
): EventInput[] {
  const sunday = getWeekStartSunday(new Date());
  const events: EventInput[] = [];

  courses.forEach((course) => {
    const sanitizedCode = course.courseCode.replace(/\s+/g, "-");
    const emoji = courseEmojis[sanitizedCode] ?? "📚";
    const courseColorHex = colorHexById(courseColors[sanitizedCode] ?? "1");

    course.schedule.forEach((entry, entryIndex) => {
      if (!entry.startTime || !entry.endTime) return;

      const { start, end } = getAdjustedTimesInMinutes(
        entry.startTime,
        entry.endTime,
        ramadanMode,
      );

      const startHour = Math.floor(start / 60);
      const startMinute = start % 60;
      const endHour = Math.floor(end / 60);
      const endMinute = end % 60;

      entry.days.forEach((dayStr) => {
        const dayIndex = parseInt(dayStr, 10);
        if (Number.isNaN(dayIndex) || dayIndex < 1 || dayIndex > 7) return;

        const jsDay = dayIndex - 1; // 1=SU ... 7=SA
        const baseDate = new Date(sunday);
        baseDate.setDate(sunday.getDate() + jsDay);

        const startDate = new Date(baseDate);
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date(baseDate);
        endDate.setHours(endHour, endMinute, 0, 0);

        events.push({
          id: `${sanitizedCode}-${entryIndex}-${dayIndex}`,
          title: `${emoji} ${course.courseCode}`,
          start: startDate,
          end: endDate,
          backgroundColor: courseColorHex,
          borderColor: courseColorHex,
          textColor: "#ffffff",
          extendedProps: {
            room: entry.room,
            activity: course.activity,
            courseName: course.courseName,
          },
        });
      });
    });
  });

  if (drivingTimeTo > 0 || drivingTimeFrom > 0) {
    const drivingColorHex = colorHexById(drivingColorId);
    const dailyBounds: Record<string, { start: number; end: number }> = {};

    courses.forEach((course) => {
      course.schedule.forEach((entry) => {
        const { start, end } = getAdjustedTimesInMinutes(
          entry.startTime,
          entry.endTime,
          ramadanMode,
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
      const jsDay = dayIndex - 1; // 1=SU ... 7=SA
      const baseDate = new Date(sunday);
      baseDate.setDate(sunday.getDate() + jsDay);

      if (drivingTimeTo > 0) {
        const startDate = new Date(baseDate);
        const endDate = new Date(baseDate);
        startDate.setHours(0, bounds.start - drivingTimeTo, 0, 0);
        endDate.setHours(0, bounds.start, 0, 0);
        events.push({
          id: `drive-to-${dayIndex}`,
          title: `${drivingEmoji} ${drivingToLabel}`,
          start: startDate,
          end: endDate,
          classNames: ["fc-driving-event"],
          backgroundColor: drivingColorHex,
          borderColor: drivingColorHex,
          textColor: "#ffffff",
        });
      }

      if (drivingTimeFrom > 0) {
        const startDate = new Date(baseDate);
        const endDate = new Date(baseDate);
        startDate.setHours(0, bounds.end, 0, 0);
        endDate.setHours(0, bounds.end + drivingTimeFrom, 0, 0);
        events.push({
          id: `drive-from-${dayIndex}`,
          title: `${drivingEmoji} ${drivingFromLabel}`,
          start: startDate,
          end: endDate,
          classNames: ["fc-driving-event"],
          backgroundColor: drivingColorHex,
          borderColor: drivingColorHex,
          textColor: "#ffffff",
        });
      }
    });
  }

  return events;
}

function App() {
  const [lang, setLang] = useState<Lang>("ar");
  const [fileName, setFileName] = useState<string>("");
  const [rawHtml, setRawHtml] = useState<string>("");
  const [parsed, setParsed] = useState<ParseState | null>(null);

  // Settings State
  const [semesterStart, setSemesterStart] = useState("2026-01-18");
  const [semesterEnd, setSemesterEnd] = useState("2026-08-23");
  const [driveToH, setDriveToH] = useState("");
  const [driveToM, setDriveToM] = useState("");
  const [driveFromH, setDriveFromH] = useState("");
  const [driveFromM, setDriveFromM] = useState("");
  const [drivingEmoji, setDrivingEmoji] = useState("🚗");
  const [ramadanMode, setRamadanMode] = useState<RamadanMode>("off");
  const [error, setError] = useState("");
  const [courseEmojis, setCourseEmojis] = useState<Record<string, string>>({});
  const [courseColors, setCourseColors] = useState<Record<string, string>>({});
  const [drivingColorId, setDrivingColorId] = useState("1");
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [calendarOpenUrl, setCalendarOpenUrl] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const strings = uiStrings[lang];
  const direction = useMemo(() => (lang === "ar" ? "rtl" : "ltr"), [lang]);
  const drivingTimeTo =
    (parseInt(driveToH || "0", 10) * 60) + parseInt(driveToM || "0", 10);
  const drivingTimeFrom =
    (parseInt(driveFromH || "0", 10) * 60) + parseInt(driveFromM || "0", 10);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const weeklyEvents = useMemo(
    () =>
      parsed
        ? buildWeeklyPreviewEvents(
          parsed.scheduleData,
          courseEmojis,
          courseColors,
          drivingColorId,
          ramadanMode,
          drivingTimeTo,
          drivingTimeFrom,
          drivingEmoji || "🚗",
          strings.drivingTo,
          strings.drivingFrom,
        )
        : [],
    [
      parsed,
      courseEmojis,
      courseColors,
      drivingColorId,
      ramadanMode,
      drivingTimeTo,
      drivingTimeFrom,
      drivingEmoji,
      strings.drivingTo,
      strings.drivingFrom,
    ],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEB_PREFS_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw) as {
        lang?: Lang;
        fileName?: string;
        rawHtml?: string;
        semesterStart?: string;
        semesterEnd?: string;
        driveToH?: string;
        driveToM?: string;
        driveFromH?: string;
        driveFromM?: string;
        drivingEmoji?: string;
        ramadanMode?: boolean | RamadanMode;
        courseEmojis?: Record<string, string>;
        courseColors?: Record<string, string>;
        drivingColorId?: string;
      };

      if (prefs.lang === "ar" || prefs.lang === "en") setLang(prefs.lang);
      if (typeof prefs.fileName === "string") setFileName(prefs.fileName);
      if (typeof prefs.semesterStart === "string") setSemesterStart(prefs.semesterStart);
      if (typeof prefs.semesterEnd === "string") setSemesterEnd(prefs.semesterEnd);
      if (typeof prefs.driveToH === "string") setDriveToH(prefs.driveToH);
      if (typeof prefs.driveToM === "string") setDriveToM(prefs.driveToM);
      if (typeof prefs.driveFromH === "string") setDriveFromH(prefs.driveFromH);
      if (typeof prefs.driveFromM === "string") setDriveFromM(prefs.driveFromM);
      if (typeof prefs.drivingEmoji === "string") setDrivingEmoji(prefs.drivingEmoji);
      if (prefs.ramadanMode === "engineering" || prefs.ramadanMode === "firstYear" || prefs.ramadanMode === "off") {
        setRamadanMode(prefs.ramadanMode);
      } else if (typeof prefs.ramadanMode === "boolean") {
        setRamadanMode(prefs.ramadanMode ? "engineering" : "off");
      }
      if (prefs.courseEmojis && typeof prefs.courseEmojis === "object") {
        setCourseEmojis(prefs.courseEmojis);
      }
      if (prefs.courseColors && typeof prefs.courseColors === "object") {
        setCourseColors(prefs.courseColors);
      }
      if (typeof prefs.drivingColorId === "string" && isValidColorId(prefs.drivingColorId)) {
        setDrivingColorId(prefs.drivingColorId);
      }

      if (typeof prefs.rawHtml === "string" && prefs.rawHtml.trim()) {
        setRawHtml(prefs.rawHtml);
        const restored = parseScheduleFromHtml(prefs.rawHtml);
        if (restored) setParsed(restored);
      }
    } catch {
      // ignore corrupted local storage
    }
  }, []);

  useEffect(() => {
    const prefs = {
      lang,
      fileName,
      rawHtml,
      semesterStart,
      semesterEnd,
      driveToH,
      driveToM,
      driveFromH,
      driveFromM,
      drivingEmoji,
      ramadanMode,
      courseEmojis,
      courseColors,
      drivingColorId,
    };
    localStorage.setItem(WEB_PREFS_KEY, JSON.stringify(prefs));
  }, [
    lang,
    fileName,
    rawHtml,
    semesterStart,
    semesterEnd,
    driveToH,
    driveToM,
    driveFromH,
    driveFromM,
    drivingEmoji,
    ramadanMode,
    courseEmojis,
    courseColors,
    drivingColorId,
  ]);

  useEffect(() => {
    if (!parsed) return;
    const keys = [...new Set(parsed.scheduleData.map((c) => c.courseCode.replace(/\s+/g, "-")))];
    const hasMissingCourseColor = keys.some((key) => !isValidColorId(courseColors[key] ?? ""));
    const missingDrivingColor = !isValidColorId(drivingColorId);
    if (!hasMissingCourseColor && !missingDrivingColor) return;

    const randomized = randomColorSelectionForCourses(keys);
    setCourseColors((prev) => {
      const next = { ...randomized.courseColors };
      keys.forEach((key) => {
        if (isValidColorId(prev[key] ?? "")) next[key] = prev[key];
      });
      return next;
    });
    if (missingDrivingColor) setDrivingColorId(randomized.drivingColorId);
  }, [parsed, courseColors, drivingColorId]);

  useEffect(() => {
    if (!parsed) return;
    const keys = [...new Set(parsed.scheduleData.map((c) => c.courseCode.replace(/\s+/g, "-")))];
    const hasMissingEmoji = keys.some((key) => !(courseEmojis[key] ?? "").trim());
    if (!hasMissingEmoji) return;

    const randomized = randomEmojiSelectionForCourses(keys);
    setCourseEmojis((prev) => {
      const next = { ...randomized };
      keys.forEach((key) => {
        if ((prev[key] ?? "").trim()) next[key] = prev[key];
      });
      return next;
    });
  }, [parsed, courseEmojis]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setRawHtml(content);
      const result = parseScheduleFromHtml(content);
      if (!result) {
        setError(strings.uploadInvalid);
        setParsed(null);
      } else {
        const colorKeys: string[] = [];
        result.scheduleData.forEach((course) => {
          const key = course.courseCode.replace(/\s+/g, "-");
          colorKeys.push(key);
        });
        const emojiMap = randomEmojiSelectionForCourses(colorKeys);
        const randomColors = randomColorSelectionForCourses(colorKeys);
        setCourseEmojis(emojiMap);
        setCourseColors(randomColors.courseColors);
        setDrivingColorId(randomColors.drivingColorId);
        setParsed(result);
      }
    };
    reader.readAsText(file);
  };

  const onDownload = () => {
    if (!parsed) return;
    if (!semesterStart || !semesterEnd) {
      setError(strings.alertDates);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const ics = generateIcs(parsed.scheduleData, {
      semesterStart: new Date(`${semesterStart}T00:00:00Z`),
      semesterEnd: new Date(`${semesterEnd}T23:59:59Z`),
      drivingTimeTo:
        drivingTimeTo,
      drivingTimeFrom:
        drivingTimeFrom,
      drivingEmoji,
      ramadanMode,
      lang,
      courseEmojis,
    });

    downloadFile(
      `schedule_${parsed.studentName.replace(/\s/g, "_")}.ics`,
      ics,
      "text/calendar"
    );
  };

  const onSyncGoogle = async () => {
    if (!parsed) return;
    if (!googleClientId) {
      setError(strings.syncGoogleUnavailable);
      return;
    }
    if (!semesterStart || !semesterEnd) {
      setError(strings.alertDates);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setError("");
    setSyncBusy(true);
    setSyncStatus(strings.syncGoogleWorking);
    setCalendarOpenUrl("");

    try {
      const options: BuildSeriesOptions = {
        semesterStart: new Date(`${semesterStart}T00:00:00Z`),
        semesterEnd: new Date(`${semesterEnd}T23:59:59Z`),
        drivingTimeTo,
        drivingTimeFrom,
        drivingEmoji,
        ramadanMode,
        lang,
        courseEmojis,
      };

      const accessToken = await requestAccessToken(googleClientId);
      const semesterLabel = `SchToCal - ${semesterStart} to ${semesterEnd}`;
      const calendar = await ensureSemesterCalendar(accessToken, semesterLabel);
      const result = await syncScheduleToGoogle({
        accessToken,
        calendarId: calendar.id,
        scheduleData: parsed.scheduleData,
        options,
        colorOverrides: {
          courseColors,
          drivingColorId,
        },
      });

      setSyncStatus(
        strings.syncGoogleDone
          .replace("{deleted}", String(result.deleted))
          .replace("{inserted}", String(result.inserted)),
      );
      setCalendarOpenUrl("https://calendar.google.com/calendar/u/0/r");
    } catch (err) {
      const message = err instanceof Error ? err.message : strings.syncGoogleFailed;
      setError(`${strings.syncGoogleFailed} ${message}`);
      setSyncStatus("");
      setCalendarOpenUrl("");
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <div className={cn("app-scroll h-screen overflow-y-auto overflow-x-hidden font-sans", theme.bgClass, theme.textClass)}>
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B6B]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFE66D]/20 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-20" dir={direction}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="text-center md:text-start">
            <h1 className={cn("text-4xl md:text-6xl font-black tracking-tighter", theme.headingClass)}>
              {strings.themeTitle}
            </h1>
            <p className={cn("mt-3 text-lg font-medium", theme.subTextClass)}>
              {strings.uploadHint}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="schmaker.user.js"
              download
              className="group flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all border border-black bg-black/5 hover:bg-black/10"
            >
              <Download className={cn("h-4 w-4", theme.accentColor)} />
              <span>{strings.downloadTampermonkey}</span>
            </a>

            <button
              onClick={() => setLang((v) => (v === "ar" ? "en" : "ar"))}
              className="group flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all border border-black bg-black/5 hover:bg-black/10"
            >
              <Languages className={cn("h-4 w-4", theme.accentColor)} />
              <span>{strings.language}</span>
            </button>
          </div>
        </motion.header>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4 border border-red-300 bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="font-bold text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Upload */}
            <Card delay={0.1}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-2.5", theme.iconContainerClass)}>
                  <UploadCloud className={cn("h-6 w-6", theme.accentColor)} />
                </div>
                <h2 className={cn("text-xl font-bold", theme.textClass)}>
                  {strings.uploadTitle}
                </h2>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "group relative cursor-pointer p-8 text-center transition-all duration-300 border-2 border-dashed",
                  theme.borderClass,
                  rawHtml ? "bg-emerald-50 border-emerald-500" : ""
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={onFileChange}
                />

                <div className="flex flex-col items-center gap-4">
                  <div
                    className={cn(
                      "p-4 transition-all duration-500",
                      rawHtml
                        ? "bg-emerald-500 text-white scale-110"
                        : cn(theme.iconContainerClass, theme.subTextClass)
                    )}
                  >
                    {rawHtml ? <FileCheck className="h-8 w-8" /> : <UploadCloud className="h-8 w-8" />}
                  </div>
                  <div className="space-y-1">
                    <p className={cn("font-bold text-lg", theme.textClass)}>
                      {fileName || strings.uploadButton}
                    </p>
                    <p className={cn("text-sm", theme.subTextClass)}>
                      {fileName ? strings.selectedFile : ".html schedule files"}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn("mt-4 border p-4 bg-white/80", theme.borderClass)}>
                <p className={cn("text-sm font-bold mb-2", theme.textClass)}>
                  {lang === "ar" ? "طريقة الحصول على ملف الجدول (HTML):" : "How to get your schedule HTML:"}
                </p>
                <ol className={cn("text-xs leading-6 list-decimal ps-4", theme.subTextClass)}>
                  <li>
                    {lang === "ar" ? "افتح الرابط:" : "Open:"}{" "}
                    <a
                      href="https://eserve.psau.edu.sa/ku/ui/student/homeIndex.faces"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline font-semibold"
                    >
                      https://eserve.psau.edu.sa/ku/ui/student/homeIndex.faces
                    </a>
                  </li>
                  <li>{lang === "ar" ? "اذهب إلى صفحة 'المقررات المسجلة'." : "Go to 'Registered Courses' (المقررات المسجلة)."}</li>
                  <li>{lang === "ar" ? "اضغط Ctrl+S أو كلك يمين > حفظ باسم، واحفظ الصفحة كملف HTML." : "Press Ctrl+S or right-click > Save as, and save the page as HTML."}</li>
                  <li>{lang === "ar" ? "ارجع هنا وارفع ملف HTML." : "Come back here and upload that HTML file."}</li>
                </ol>
              </div>
            </Card>

            {/* Settings */}
            <Card delay={0.2}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-2.5", theme.iconContainerClass)}>
                  <Calendar className={cn("h-6 w-6", theme.accentColor)} />
                </div>
                <h2 className={cn("text-xl font-bold", theme.textClass)}>
                  {strings.settingsTitle}
                </h2>
              </div>

              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label={strings.semesterStart} icon={Calendar}>
                    <StyledInput
                      type="date"
                      value={semesterStart}
                      onChange={(e) => setSemesterStart(e.target.value)}
                    />
                  </InputGroup>
                  <InputGroup label={strings.semesterEnd} icon={Calendar}>
                    <StyledInput
                      type="date"
                      value={semesterEnd}
                      onChange={(e) => setSemesterEnd(e.target.value)}
                    />
                  </InputGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup label={strings.drivingTimeTo} icon={Car}>
                    <div className="flex gap-2">
                      <StyledInput
                        type="number"
                        placeholder={strings.hoursPlaceholder}
                        value={driveToH}
                        onChange={(e) => setDriveToH(e.target.value)}
                      />
                      <StyledInput
                        type="number"
                        placeholder={strings.minutesPlaceholder}
                        value={driveToM}
                        onChange={(e) => setDriveToM(e.target.value)}
                      />
                    </div>
                  </InputGroup>
                  <InputGroup label={strings.drivingTimeFrom} icon={Car}>
                    <div className="flex gap-2">
                      <StyledInput
                        type="number"
                        placeholder={strings.hoursPlaceholder}
                        value={driveFromH}
                        onChange={(e) => setDriveFromH(e.target.value)}
                      />
                      <StyledInput
                        type="number"
                        placeholder={strings.minutesPlaceholder}
                        value={driveFromM}
                        onChange={(e) => setDriveFromM(e.target.value)}
                      />
                    </div>
                  </InputGroup>
                </div>

                <div className={cn("pt-4 border-t", theme.borderClass)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputGroup label={strings.ramadanSchedule} icon={Calendar}>
                      <StyledSelect
                        label={strings.ramadanSchedule}
                        value={ramadanMode}
                        onChange={(val) => setRamadanMode(val as RamadanMode)}
                        options={[
                          { value: "off", label: strings.ramadanOff },
                          { value: "engineering", label: strings.ramadanEngineering },
                          { value: "firstYear", label: strings.ramadanFirstYear },
                        ]}
                        direction={direction}
                      />
                    </InputGroup>

                    <InputGroup label={strings.drivingEmoji} icon={Car}>
                      <div className="flex gap-2">
                        <StyledInput
                          type="text"
                          value={drivingEmoji}
                          onChange={(e) => setDrivingEmoji(e.target.value)}
                          className="text-center"
                        />
                        <select
                          value={drivingColorId}
                          onChange={(e) => setDrivingColorId(e.target.value)}
                          className={cn(
                            "h-12 px-3 min-w-[8.5rem] border outline-none transition-all duration-300 bg-white",
                            theme.borderClass,
                            theme.textClass
                          )}
                          style={{ borderColor: colorHexById(drivingColorId) }}
                        >
                          {GOOGLE_COLOR_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {lang === "ar" ? option.labelAr : option.labelEn}
                            </option>
                          ))}
                        </select>
                        <span
                          className="h-12 w-5 border border-black"
                          style={{ backgroundColor: colorHexById(drivingColorId) }}
                          title={lang === "ar" ? "لون القيادة" : "Driving color"}
                        />
                      </div>
                    </InputGroup>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="grid gap-3">
                  <button
                    onClick={onDownload}
                    disabled={!parsed}
                    className={cn(
                      "w-full py-4 font-bold text-lg transition-all flex items-center justify-center gap-2",
                      theme.buttonClass,
                      !parsed && "opacity-50 cursor-not-allowed grayscale"
                    )}
                  >
                    {strings.downloadIcs}
                    <Download className="h-5 w-5" />
                  </button>

                  <button
                    onClick={onSyncGoogle}
                    disabled={!parsed || !googleClientId || syncBusy}
                    className={cn(
                      "w-full py-4 font-bold text-lg transition-all flex items-center justify-center gap-2",
                      theme.buttonSecondaryClass,
                      (!parsed || !googleClientId || syncBusy) && "opacity-50 cursor-not-allowed grayscale"
                    )}
                  >
                    {syncBusy ? strings.syncGoogleWorking : strings.syncGoogleCalendar}
                    {syncBusy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CloudUpload className="h-5 w-5" />}
                  </button>

                  {!googleClientId && (
                    <div className="space-y-1">
                      <p className={cn("text-xs", theme.subTextClass)}>{strings.syncGoogleUnavailable}</p>
                      <p className={cn("text-[10px] font-mono", theme.subTextClass)}>
                        debug: mode={import.meta.env.MODE} hasClientId={String(Boolean(googleClientId))}
                      </p>
                    </div>
                  )}
                  {syncStatus && <p className={cn("text-xs font-semibold text-emerald-700")}>{syncStatus}</p>}
                  {calendarOpenUrl && (
                    <a
                      href={calendarOpenUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={cn("text-xs font-semibold underline", theme.textClass)}
                    >
                      {lang === "ar" ? "افتح Google Calendar في تبويب جديد" : "Open Google Calendar in a new tab"}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-7 flex">
            <Card delay={0.3} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className={cn("p-2.5", theme.iconContainerClass)}>
                  <Eye className={cn("h-6 w-6", theme.accentColor)} />
                </div>
                <div>
                  <h2 className={cn("text-xl font-bold", theme.textClass)}>
                    {strings.previewTitle}
                  </h2>
                  {parsed && <p className={cn("text-xs", theme.subTextClass)}>{parsed.studentName}</p>}
                </div>
              </div>

              {!parsed ? (
                <div className={cn("flex flex-1 flex-col items-center justify-center text-center p-8 border-2 border-dashed", theme.borderClass, theme.cardInnerBg)}>
                  <div className={cn("h-16 w-16 flex items-center justify-center mb-4", theme.iconContainerClass)}>
                    <Clock className={cn("h-8 w-8", theme.subTextClass)} />
                  </div>
                  <p className={cn("font-medium", theme.subTextClass)}>
                    {strings.previewEmptyHint}
                  </p>
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 min-h-0">
                  <div className={cn("schedule-preview border p-2 bg-white", theme.borderClass)}>
                    <FullCalendar
                      plugins={[timeGridPlugin]}
                      initialView="timeGridWeek"
                      headerToolbar={false}
                      allDaySlot={false}
                      height={600}
                      expandRows
                      slotMinTime="06:00:00"
                      slotMaxTime="29:00:00"
                      firstDay={0}
                      hiddenDays={[5, 6]}
                      dayHeaderFormat={{ weekday: "short" }}
                      events={weeklyEvents}
                      eventTimeFormat={{
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }}
                      eventContent={(arg: EventContentArg) => (
                        <div className="fc-event-custom" dir={direction}>
                          <div className="fc-event-title-custom">{arg.event.title}</div>
                          <div className="fc-event-time-custom">{arg.timeText}</div>
                        </div>
                      )}
                      locale={lang === "ar" ? arLocale : "en"}
                      direction={direction}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {parsed.scheduleData.map((course, idx) => {
                      const key = course.courseCode.replace(/\s+/g, "-");
                      return (
                        <motion.div
                          key={`${key}-${idx}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * idx }}
                          className={cn(
                            "relative flex items-start gap-4 p-4 transition-all group border",
                            theme.borderClass,
                            "bg-white hover:bg-gray-50 shadow-sm"
                          )}
                          style={{ borderTopWidth: 4, borderTopColor: colorHexById(courseColors[key] ?? "1") }}
                        >
                          <div className={cn("h-12 w-12 flex items-center justify-center border shrink-0", theme.borderClass, theme.cardInnerBg)}>
                            <input
                              className="w-full h-full bg-transparent text-center text-2xl focus:outline-none cursor-pointer"
                              value={courseEmojis[key] ?? "📚"}
                              onChange={(e) => setCourseEmojis((prev) => ({ ...prev, [key]: e.target.value }))}
                            />
                          </div>
                          <div className="shrink-0">
                            <select
                              value={courseColors[key] ?? ""}
                              onChange={(e) => setCourseColors((prev) => ({ ...prev, [key]: e.target.value }))}
                              className={cn(
                                "h-12 px-2 text-xs border outline-none bg-white",
                                theme.borderClass,
                                theme.textClass
                              )}
                              style={{ borderColor: colorHexById(courseColors[key] ?? "1") }}
                              title={lang === "ar" ? "لون Google" : "Google color"}
                            >
                              {GOOGLE_COLOR_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {lang === "ar" ? option.labelAr : option.labelEn}
                                </option>
                              ))}
                            </select>
                            <div
                              className="mt-1 h-1.5 w-full border border-black"
                              style={{ backgroundColor: colorHexById(courseColors[key] ?? "1") }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className={cn("font-bold truncate", theme.textClass)}>{course.courseCode}</h3>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600">
                                {course.sectionNumber}
                              </span>
                            </div>
                            <p className={cn("text-xs mt-1 line-clamp-2 leading-relaxed", theme.subTextClass)}>
                              {course.courseName}
                            </p>
                            <div className={cn("mt-2 text-[10px] uppercase tracking-wider font-bold", theme.accentColor)}>
                              {course.activity}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
