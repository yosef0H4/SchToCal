import { generateIcs, downloadFile } from "../core/ics";
import { parseScheduleFromDocument } from "../core/parse";
import { uiStrings } from "../core/strings";
import { Lang, Prefs } from "../core/types";
import { CONTROLS_HTML, USERSCRIPT_CSS } from "./assets/generated";

const PREFS_KEY = "schedulePrefs";
let currentLanguage: Lang = "ar";
let stylesInjected = false;

const byId = <T extends HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

const byIdRequired = <T extends HTMLElement>(id: string): T => {
  const el = byId<T>(id);
  if (!el) throw new Error(`Required element not found: ${id}`);
  return el;
};

function injectStyles(): void {
  if (stylesInjected) return;
  const styleEl = document.createElement("style");
  styleEl.id = "schmaker-userscript-styles";
  styleEl.textContent = USERSCRIPT_CSS;
  document.head.appendChild(styleEl);
  stylesInjected = true;
}

function saveState(): void {
  const courseEmojis: Record<string, string> = {};
  document
    .querySelectorAll<HTMLInputElement>('input[id^="emoji-input-"]')
    .forEach((input) => {
      const key = input.id.replace("emoji-input-", "");
      courseEmojis[key] = input.value;
    });

  const prefs: Prefs = {
    lang: currentLanguage,
    values: {},
    courseEmojis,
  };

  document
    .querySelectorAll<HTMLInputElement | HTMLSelectElement>(".save-state")
    .forEach((el) => {
      prefs.values[el.id] = el.value;
    });

  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function updateUIText(): void {
  const strings = uiStrings[currentLanguage];
  const isArabic = currentLanguage === "ar";

  byIdRequired<HTMLElement>("custom-controls-container").style.direction = isArabic
    ? "rtl"
    : "ltr";

  byIdRequired<HTMLLabelElement>("labelSemesterStart").textContent = strings.semesterStart;
  byIdRequired<HTMLLabelElement>("labelSemesterEnd").textContent = strings.semesterEnd;
  byIdRequired<HTMLLabelElement>("labelDrivingTimeTo").textContent = strings.drivingTimeTo;
  byIdRequired<HTMLLabelElement>("labelDrivingTimeFrom").textContent = strings.drivingTimeFrom;
  byIdRequired<HTMLLabelElement>("labelDrivingEmoji").textContent = strings.drivingEmoji;
  byIdRequired<HTMLLabelElement>("labelRamadanMode").textContent = strings.ramadanMode;

  byIdRequired<HTMLInputElement>("drivingTimeToHours").placeholder = strings.hoursPlaceholder;
  byIdRequired<HTMLInputElement>("drivingTimeToMinutes").placeholder = strings.minutesPlaceholder;
  byIdRequired<HTMLInputElement>("drivingTimeFromHours").placeholder = strings.hoursPlaceholder;
  byIdRequired<HTMLInputElement>("drivingTimeFromMinutes").placeholder = strings.minutesPlaceholder;

  const dl = document.querySelector<HTMLElement>("#downloadIcsBtn span");
  const gd = document.querySelector<HTMLElement>("#showGuideBtn span");
  const lg = document.querySelector<HTMLElement>("#toggleLangBtn span");
  const rs = document.querySelector<HTMLElement>("#resetBtn span");

  if (dl) dl.textContent = strings.downloadIcs;
  if (gd) gd.textContent = strings.guide;
  if (lg) lg.textContent = strings.language;
  if (rs) rs.textContent = strings.reset;
}

function loadState(): void {
  const savedPrefs = localStorage.getItem(PREFS_KEY);
  if (!savedPrefs) {
    updateUIText();
    return;
  }

  const parsed = JSON.parse(savedPrefs) as Partial<Prefs>;
  currentLanguage = parsed.lang === "en" ? "en" : "ar";

  if (parsed.values) {
    Object.keys(parsed.values).forEach((id) => {
      const el = byId<HTMLInputElement | HTMLSelectElement>(id);
      if (el) el.value = parsed.values?.[id] ?? "";
    });
  }

  if (parsed.courseEmojis) {
    Object.keys(parsed.courseEmojis).forEach((sanitizedCode) => {
      const input = byId<HTMLInputElement>(`emoji-input-${sanitizedCode}`);
      if (input) input.value = parsed.courseEmojis?.[sanitizedCode] ?? input.value;
    });
  }

  updateUIText();
}

function resetState(event: MouseEvent): void {
  event.preventDefault();
  if (
    confirm(
      currentLanguage === "ar"
        ? "هل أنت متأكد من أنك تريد إعادة تعيين جميع الإعدادات؟"
        : "Are you sure you want to reset all settings?",
    )
  ) {
    localStorage.removeItem(PREFS_KEY);
    location.reload();
  }
}

function toggleLanguage(event: MouseEvent): void {
  event.preventDefault();
  currentLanguage = currentLanguage === "ar" ? "en" : "ar";
  updateUIText();
  saveState();
}

function showGuide(event: MouseEvent): void {
  event.preventDefault();

  const strings = uiStrings[currentLanguage];
  const isArabic = currentLanguage === "ar";

  const modalOverlay = document.createElement("div");
  modalOverlay.className = "sm-guide-overlay";

  const modalContent = document.createElement("div");
  modalContent.className = "sm-guide-content";
  modalContent.style.textAlign = isArabic ? "right" : "left";
  modalContent.style.direction = isArabic ? "rtl" : "ltr";

  const title = document.createElement("h2");
  title.textContent = strings.guideTitle;

  const steps = document.createElement("ol");
  steps.setAttribute("dir", isArabic ? "rtl" : "ltr");
  [
    strings.guideStep1,
    strings.guideStep2,
    strings.guideStep3,
    strings.guideStep4,
    strings.guideStep5,
  ].forEach((stepText, index) => {
    const li = document.createElement("li");
    li.textContent = stepText;
    if (index === 4) li.style.fontWeight = "bold";
    steps.appendChild(li);
  });

  const closeBtn = document.createElement("button");
  closeBtn.id = "guideCloseBtn";
  closeBtn.textContent = strings.guideClose;
  closeBtn.style.float = isArabic ? "left" : "right";

  modalContent.appendChild(title);
  modalContent.appendChild(steps);
  modalContent.appendChild(closeBtn);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  modalOverlay.onclick = (e: MouseEvent) => {
    if (e.target === modalOverlay) document.body.removeChild(modalOverlay);
  };

  closeBtn.onclick = () => {
    document.body.removeChild(modalOverlay);
  };
}

function injectEmojiInputs(): void {
  const scheduleTable = byId<HTMLElement>("myForm:studScheduleTable");
  if (!scheduleTable) return;

  const defaultEmojis = [
    "📚",
    "💻",
    "🧪",
    "📈",
    "🧠",
    "💡",
    "✍️",
    "🗣️",
    "🌍",
    "🕌",
    "🔢",
    "⚛️",
    "📜",
    "⚖️",
    "🎨",
  ];

  let emojiIndex = 0;
  const processedCourses = new Set<string>();

  scheduleTable.querySelectorAll<HTMLTableRowElement>("tbody > tr").forEach((row) => {
    const courseCodeCell = row.querySelector<HTMLElement>('td[data-th="رمز المقرر"]');
    if (!courseCodeCell) return;

    const courseCode = courseCodeCell.innerText.trim().split("\n")[0] ?? "";
    if (!courseCode || processedCourses.has(courseCode)) return;

    processedCourses.add(courseCode);
    const input = document.createElement("input");
    input.type = "text";
    const sanitizedCode = courseCode.replace(/\s+/g, "-");
    input.id = `emoji-input-${sanitizedCode}`;
    input.style.width = "40px";
    input.style.textAlign = "center";
    input.style.margin = "0 10px";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "4px";
    input.value = defaultEmojis[emojiIndex % defaultEmojis.length];
    emojiIndex += 1;

    const centerTag = courseCodeCell.querySelector<HTMLElement>("center");
    if (centerTag) centerTag.appendChild(input);
    else courseCodeCell.appendChild(input);
  });
}

function addSaveListeners(): void {
  document
    .querySelectorAll<HTMLElement>('.save-state, input[id^="emoji-input-"]')
    .forEach((element) => {
      element.addEventListener("change", saveState);
    });
}

function parseAndDownloadIcs(event: MouseEvent): void {
  event.preventDefault();

  const strings = uiStrings[currentLanguage];
  const startDateStr = byIdRequired<HTMLInputElement>("semesterStart").value;
  const endDateStr = byIdRequired<HTMLInputElement>("semesterEnd").value;

  if (!startDateStr || !endDateStr) {
    alert(strings.alertDates);
    return;
  }

  const parsed = parseScheduleFromDocument(document);
  if (!parsed) {
    alert(strings.alertTable);
    return;
  }

  const hTo = parseInt(byIdRequired<HTMLInputElement>("drivingTimeToHours").value, 10) || 0;
  const mTo = parseInt(byIdRequired<HTMLInputElement>("drivingTimeToMinutes").value, 10) || 0;
  const hFrom = parseInt(byIdRequired<HTMLInputElement>("drivingTimeFromHours").value, 10) || 0;
  const mFrom = parseInt(byIdRequired<HTMLInputElement>("drivingTimeFromMinutes").value, 10) || 0;
  const drivingEmoji = byIdRequired<HTMLInputElement>("drivingEmoji").value || "🚗";
  const ramadanMode = byId<HTMLSelectElement>("ramadanMode")?.value === "on";

  const courseEmojis: Record<string, string> = {};
  document.querySelectorAll<HTMLInputElement>('input[id^="emoji-input-"]').forEach((input) => {
    const key = input.id.replace("emoji-input-", "");
    courseEmojis[key] = input.value;
  });

  const icsString = generateIcs(parsed.scheduleData, {
    semesterStart: new Date(`${startDateStr}T00:00:00Z`),
    semesterEnd: new Date(`${endDateStr}T23:59:59Z`),
    drivingTimeTo: hTo * 60 + mTo,
    drivingTimeFrom: hFrom * 60 + mFrom,
    drivingEmoji,
    ramadanMode,
    lang: currentLanguage,
    courseEmojis,
  });

  downloadFile(
    `schedule_${parsed.studentName.replace(/\s/g, "_")}.ics`,
    icsString,
    "text/calendar",
  );
}

function initializeScript(): void {
  const printButtonContainer = document.querySelector<HTMLAnchorElement>(
    "a#myForm\\:printLink",
  );

  if (!printButtonContainer) return;

  injectStyles();

  const controlsContainer = document.createElement("div");
  controlsContainer.id = "custom-controls-container";
  controlsContainer.innerHTML = CONTROLS_HTML;

  const buttonWrapper = document.createElement("div");
  buttonWrapper.className = "sm-button-wrapper";

  const createButton = (
    id: string,
    clickHandler: (event: MouseEvent) => void,
  ): HTMLAnchorElement => {
    const btn = printButtonContainer.cloneNode(true) as HTMLAnchorElement;
    btn.id = id;
    btn.href = "#";
    btn.onclick = clickHandler;
    btn.style.textDecoration = "none";
    return btn;
  };

  buttonWrapper.appendChild(createButton("downloadIcsBtn", parseAndDownloadIcs));
  buttonWrapper.appendChild(createButton("showGuideBtn", showGuide));
  buttonWrapper.appendChild(createButton("toggleLangBtn", toggleLanguage));
  buttonWrapper.appendChild(createButton("resetBtn", resetState));
  controlsContainer.appendChild(buttonWrapper);

  const semesterSelector = byId<HTMLElement>("myForm:selectSemester");
  if (!semesterSelector?.parentElement?.parentElement) return;

  semesterSelector.parentElement.parentElement.insertAdjacentElement(
    "afterend",
    controlsContainer,
  );

  injectEmojiInputs();
  loadState();
  addSaveListeners();
}

const observer = new MutationObserver((_, obs) => {
  const anchorElement = document.querySelector("a#myForm\\:printLink");
  if (anchorElement) {
    obs.disconnect();
    initializeScript();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
