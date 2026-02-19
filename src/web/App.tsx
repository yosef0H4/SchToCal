import { ChangeEvent, useMemo, useState, useRef } from "react";
import { generateIcs, downloadFile } from "../core/ics";
import { parseScheduleFromHtml } from "../core/parse";
import { uiStrings } from "../core/strings";
import { CourseSchedule, Lang } from "../core/types";
import { motion, AnimatePresence } from "framer-motion";
import { theme } from "./themeConfig";
import {
  UploadCloud,
  Calendar,
  Clock,
  Car,
  Moon,
  Download,
  Languages,
  FileCheck,
  AlertCircle,
  Sparkles,
  Smile,
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
      "w-full px-4 py-3 outline-none transition-all duration-300",
      theme.inputClass,
      theme.textClass,
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
  />
);

// --- Main App ---

type ParseState = {
  scheduleData: CourseSchedule[];
  studentName: string;
};

function App() {
  const [lang, setLang] = useState<Lang>("ar");
  const [fileName, setFileName] = useState<string>("");
  const [rawHtml, setRawHtml] = useState<string>("");
  const [parsed, setParsed] = useState<ParseState | null>(null);

  // Settings State
  const [semesterStart, setSemesterStart] = useState("");
  const [semesterEnd, setSemesterEnd] = useState("");
  const [driveToH, setDriveToH] = useState("");
  const [driveToM, setDriveToM] = useState("");
  const [driveFromH, setDriveFromH] = useState("");
  const [driveFromM, setDriveFromM] = useState("");
  const [drivingEmoji, setDrivingEmoji] = useState("🚗");
  const [ramadanMode, setRamadanMode] = useState(false);
  const [error, setError] = useState("");
  const [courseEmojis, setCourseEmojis] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const strings = uiStrings[lang];
  const direction = useMemo(() => (lang === "ar" ? "rtl" : "ltr"), [lang]);

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
        const emojiMap: Record<string, string> = {};
        result.scheduleData.forEach((course) => {
          const key = course.courseCode.replace(/\s+/g, "-");
          emojiMap[key] = emojiMap[key] ?? "📚";
        });
        setCourseEmojis(emojiMap);
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
        (parseInt(driveToH || "0", 10) * 60) + (parseInt(driveToM || "0", 10)),
      drivingTimeFrom:
        (parseInt(driveFromH || "0", 10) * 60) + (parseInt(driveFromM || "0", 10)),
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

  return (
    <div className={cn("min-h-screen font-sans", theme.bgClass, theme.textClass)}>
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

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 md:py-20" dir={direction}>
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

          <button
            onClick={() => setLang((v) => (v === "ar" ? "en" : "ar"))}
            className="group flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all border border-black bg-black/5 hover:bg-black/10"
          >
            <Languages className={cn("h-4 w-4", theme.accentColor)} />
            <span>{strings.language}</span>
          </button>
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
          <div className="lg:col-span-7 space-y-6">
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
            </Card>

            {/* Settings */}
            <Card delay={0.2}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-2.5", theme.iconContainerClass)}>
                  <Calendar className={cn("h-6 w-6", theme.accentColor)} />
                </div>
                <h2 className={cn("text-xl font-bold", theme.textClass)}>
                  {strings.themeTitle} Settings
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

                <div className={cn("flex flex-wrap items-center gap-4 pt-4 border-t", theme.borderClass)}>
                  <div className={cn("flex items-center gap-3 px-4 py-2 border", theme.borderClass, theme.cardInnerBg)}>
                    <span className={cn("text-sm", theme.subTextClass)}>{strings.drivingEmoji}</span>
                    <input
                      type="text"
                      value={drivingEmoji}
                      onChange={(e) => setDrivingEmoji(e.target.value)}
                      className="w-10 bg-transparent text-center text-xl outline-none"
                    />
                  </div>

                  <label className="flex flex-1 items-center justify-between cursor-pointer px-4 py-3 border transition hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-amber-500" />
                      <span className={cn("text-sm font-bold", theme.textClass)}>{strings.ramadanMode}</span>
                    </div>
                    <div className={cn("h-6 w-11 rounded-full transition-colors relative", ramadanMode ? "bg-emerald-400" : "bg-slate-300")}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={ramadanMode}
                        onChange={(e) => setRamadanMode(e.target.checked)}
                      />
                      <div className={cn("absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform", ramadanMode ? "translate-x-5" : "translate-x-0")} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-8">
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
              </div>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-5 flex">
            <Card delay={0.3} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className={cn("p-2.5", theme.iconContainerClass)}>
                  <Sparkles className={cn("h-6 w-6", theme.accentColor)} />
                </div>
                <div>
                  <h2 className={cn("text-xl font-bold", theme.textClass)}>Preview</h2>
                  {parsed && <p className={cn("text-xs", theme.subTextClass)}>{parsed.studentName}</p>}
                </div>
              </div>

              {!parsed ? (
                <div className={cn("flex flex-1 flex-col items-center justify-center text-center p-8 border-2 border-dashed", theme.borderClass, theme.cardInnerBg)}>
                  <div className={cn("h-16 w-16 flex items-center justify-center mb-4", theme.iconContainerClass)}>
                    <Clock className={cn("h-8 w-8", theme.subTextClass)} />
                  </div>
                  <p className={cn("font-medium", theme.subTextClass)}>Upload your schedule HTML to preview.</p>
                </div>
              ) : (
                <div className="flex-1 space-y-3 overflow-y-auto pr-2 min-h-0">
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
                      >
                        <div className={cn("relative h-12 w-12 flex items-center justify-center border shrink-0", theme.borderClass, theme.cardInnerBg)}>
                          <input
                            className="w-full h-full bg-transparent text-center text-2xl focus:outline-none cursor-pointer"
                            value={courseEmojis[key] ?? "📚"}
                            onChange={(e) => setCourseEmojis((prev) => ({ ...prev, [key]: e.target.value }))}
                          />
                          <Smile className="absolute -bottom-1 -right-1 h-3 w-3 text-slate-400 pointer-events-none" />
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
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
