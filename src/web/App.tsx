import { ChangeEvent, useMemo, useState } from "react";
import { generateIcs, downloadFile } from "../core/ics";
import { parseScheduleFromHtml } from "../core/parse";
import { uiStrings } from "../core/strings";
import { CourseSchedule, Lang } from "../core/types";

type ParseState = {
  scheduleData: CourseSchedule[];
  studentName: string;
};

function App() {
  const [lang, setLang] = useState<Lang>("ar");
  const [fileName, setFileName] = useState<string>("");
  const [rawHtml, setRawHtml] = useState<string>("");
  const [parsed, setParsed] = useState<ParseState | null>(null);
  const [semesterStart, setSemesterStart] = useState("");
  const [semesterEnd, setSemesterEnd] = useState("");
  const [driveToH, setDriveToH] = useState("0");
  const [driveToM, setDriveToM] = useState("0");
  const [driveFromH, setDriveFromH] = useState("0");
  const [driveFromM, setDriveFromM] = useState("0");
  const [drivingEmoji, setDrivingEmoji] = useState("🚗");
  const [ramadanMode, setRamadanMode] = useState(false);
  const [error, setError] = useState("");
  const [courseEmojis, setCourseEmojis] = useState<Record<string, string>>({});

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
      setParsed(null);
      setCourseEmojis({});
    };
    reader.readAsText(file);
  };

  const parseSchedule = () => {
    if (!rawHtml) return;
    const result = parseScheduleFromHtml(rawHtml);
    if (!result) {
      setError(strings.uploadInvalid);
      setParsed(null);
      return;
    }

    const emojiMap: Record<string, string> = {};
    result.scheduleData.forEach((course) => {
      const key = course.courseCode.replace(/\s+/g, "-");
      emojiMap[key] = emojiMap[key] ?? "📚";
    });

    setCourseEmojis(emojiMap);
    setParsed(result);
    setError("");
  };

  const onDownload = () => {
    if (!parsed) return;
    if (!semesterStart || !semesterEnd) {
      setError(strings.alertDates);
      return;
    }

    const ics = generateIcs(parsed.scheduleData, {
      semesterStart: new Date(`${semesterStart}T00:00:00Z`),
      semesterEnd: new Date(`${semesterEnd}T23:59:59Z`),
      drivingTimeTo:
        (parseInt(driveToH, 10) || 0) * 60 + (parseInt(driveToM, 10) || 0),
      drivingTimeFrom:
        (parseInt(driveFromH, 10) || 0) * 60 + (parseInt(driveFromM, 10) || 0),
      drivingEmoji,
      ramadanMode,
      lang,
      courseEmojis,
    });

    downloadFile(
      `schedule_${parsed.studentName.replace(/\s/g, "_")}.ics`,
      ics,
      "text/calendar",
    );
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#1d3557_0%,#0b132b_40%,#04101f_100%)] p-6 text-slate-100">
      <div className="mx-auto max-w-5xl" dir={direction}>
        <header className="mb-6 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-black tracking-tight">{strings.themeTitle}</h1>
            <button
              className="rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-slate-900"
              onClick={() => setLang((v) => (v === "ar" ? "en" : "ar"))}
            >
              {strings.language}
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-200">{strings.uploadHint}</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <h2 className="mb-4 text-xl font-bold">{strings.uploadTitle}</h2>
            <label className="block cursor-pointer rounded-2xl border border-dashed border-white/40 p-6 text-center text-sm hover:bg-white/10">
              <span className="font-semibold">{strings.uploadButton}</span>
              <input type="file" accept=".html,.htm,text/html" className="hidden" onChange={onFileChange} />
            </label>
            <p className="mt-3 text-xs text-slate-300">
              {strings.selectedFile} {fileName || strings.noFile}
            </p>
            <button
              className="mt-4 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-900"
              disabled={!rawHtml}
              onClick={parseSchedule}
            >
              {strings.generatePreview}
            </button>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <h2 className="mb-4 text-xl font-bold">{strings.downloadIcs}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="date" value={semesterStart} onChange={(e) => setSemesterStart(e.target.value)} className="rounded-xl bg-white/90 p-2 text-slate-900" />
              <input type="date" value={semesterEnd} onChange={(e) => setSemesterEnd(e.target.value)} className="rounded-xl bg-white/90 p-2 text-slate-900" />
              <input type="number" value={driveToH} onChange={(e) => setDriveToH(e.target.value)} min={0} className="rounded-xl bg-white/90 p-2 text-slate-900" placeholder={strings.hoursPlaceholder} />
              <input type="number" value={driveToM} onChange={(e) => setDriveToM(e.target.value)} min={0} max={59} className="rounded-xl bg-white/90 p-2 text-slate-900" placeholder={strings.minutesPlaceholder} />
              <input type="number" value={driveFromH} onChange={(e) => setDriveFromH(e.target.value)} min={0} className="rounded-xl bg-white/90 p-2 text-slate-900" placeholder={strings.hoursPlaceholder} />
              <input type="number" value={driveFromM} onChange={(e) => setDriveFromM(e.target.value)} min={0} max={59} className="rounded-xl bg-white/90 p-2 text-slate-900" placeholder={strings.minutesPlaceholder} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input type="text" value={drivingEmoji} onChange={(e) => setDrivingEmoji(e.target.value)} className="w-16 rounded-xl bg-white/90 p-2 text-center text-slate-900" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={ramadanMode} onChange={(e) => setRamadanMode(e.target.checked)} />
                {strings.ramadanMode}
              </label>
            </div>
            <button
              className="mt-4 rounded-xl bg-emerald-300 px-4 py-2 font-bold text-slate-900 disabled:opacity-50"
              disabled={!parsed}
              onClick={onDownload}
            >
              {strings.downloadIcs}
            </button>
          </div>
        </section>

        {parsed ? (
          <section className="mt-6 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <h3 className="mb-3 text-lg font-bold">{parsed.studentName}</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {parsed.scheduleData.map((course) => {
                const key = course.courseCode.replace(/\s+/g, "-");
                return (
                  <div key={`${course.courseCode}-${course.sectionNumber}`} className="rounded-xl bg-white/10 p-3">
                    <p className="font-semibold">{course.courseCode}</p>
                    <p className="text-sm text-slate-200">{course.courseName}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs">Emoji</span>
                      <input
                        className="w-14 rounded-lg bg-white/90 p-1 text-center text-slate-900"
                        value={courseEmojis[key] ?? "📚"}
                        onChange={(e) =>
                          setCourseEmojis((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/20 p-3 text-sm text-rose-100">{error}</p>
        ) : null}
      </div>
    </main>
  );
}

export default App;
