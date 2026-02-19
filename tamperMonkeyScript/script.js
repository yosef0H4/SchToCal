// ==UserScript==
// @name         PSAU Schedule to ICS Downloader (with Saving & Reset)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds a control panel to download the course schedule as an ICS file. Remembers all your settings. Features an Arabic UI, language toggle, and a user guide.
// @author       You
// @match        https://eserve.psau.edu.sa/ku/ui/*
// @grant        none
// ==/UserScript==
(() => {
    "use strict";
    const observer = new MutationObserver((_, obs) => {
        const anchorElement = document.querySelector("a#myForm\\:printLink");
        if (anchorElement) {
            obs.disconnect();
            SchMakerApp.initializeScript();
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();
var SchMakerApp;
(function (SchMakerApp) {
    SchMakerApp.CONTROLS_HTML = `<div class="sm-field sm-col">
  <label for="semesterStart" id="labelSemesterStart"></label>
  <input type="date" id="semesterStart" class="save-state sm-input" />
</div>
<div class="sm-field sm-col">
  <label for="semesterEnd" id="labelSemesterEnd"></label>
  <input type="date" id="semesterEnd" class="save-state sm-input" />
</div>
<div class="sm-field sm-col">
  <label id="labelDrivingTimeTo"></label>
  <div class="sm-row">
    <input type="number" id="drivingTimeToHours" class="save-state sm-input sm-time" min="0" />
    <input type="number" id="drivingTimeToMinutes" class="save-state sm-input sm-time" min="0" max="59" />
  </div>
</div>
<div class="sm-field sm-col">
  <label id="labelDrivingTimeFrom"></label>
  <div class="sm-row">
    <input type="number" id="drivingTimeFromHours" class="save-state sm-input sm-time" min="0" />
    <input type="number" id="drivingTimeFromMinutes" class="save-state sm-input sm-time" min="0" max="59" />
  </div>
</div>
<div class="sm-field sm-col">
  <label for="drivingEmoji" id="labelDrivingEmoji"></label>
  <input type="text" id="drivingEmoji" class="save-state sm-input sm-emoji" value="🚗" />
</div>
<div class="sm-field sm-col">
  <label id="labelRamadanMode" for="ramadanMode">Ramadan Mode</label>
  <select id="ramadanMode" class="save-state sm-input">
    <option value="off">Off</option>
    <option value="on">On</option>
  </select>
</div>`;
    SchMakerApp.USERSCRIPT_CSS = `#custom-controls-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 15px;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

#custom-controls-container .sm-col {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

#custom-controls-container .sm-col label {
  font-weight: bold;
  margin-bottom: 5px;
}

#custom-controls-container .sm-row {
  display: flex;
  gap: 5px;
  align-items: center;
}

#custom-controls-container .sm-input {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

#custom-controls-container .sm-time {
  width: 60px;
}

#custom-controls-container .sm-emoji {
  width: 50px;
  text-align: center;
}

.sm-button-wrapper {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.sm-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sm-guide-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  font-family: Arial, sans-serif;
}

.sm-guide-content h2 {
  margin-top: 0;
  color: #333;
}

.sm-guide-content ol {
  line-height: 1.6;
}

.sm-guide-content ol[dir="rtl"] {
  padding-right: 20px;
}

.sm-guide-content ol[dir="ltr"] {
  padding-left: 20px;
}

#guideCloseBtn {
  padding: 10px 20px;
  border: none;
  background-color: #007bff;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
}`;
})(SchMakerApp || (SchMakerApp = {}));
var SchMakerApp;
(function (SchMakerApp) {
    SchMakerApp.PREFS_KEY = "psauSchedulePrefs";
    SchMakerApp.uiStrings = {
        ar: {
            semesterStart: "بداية الفصل الدراسي:",
            semesterEnd: "نهاية الفصل الدراسي:",
            drivingTimeTo: "الوقت للوصول للجامعة:",
            drivingTimeFrom: "الوقت للعودة للمنزل:",
            hoursPlaceholder: "ساعة",
            minutesPlaceholder: "دقيقة",
            drivingEmoji: "إيموجي القيادة:",
            downloadIcs: "تحميل ICS",
            guide: "دليل",
            reset: "إعادة تعيين",
            language: "English",
            alertDates: "الرجاء تحديد تاريخ بداية ونهاية الفصل الدراسي أولاً.",
            alertTable: "جدول المواد الدراسية غير موجود!",
            guideTitle: "دليل الاستخدام",
            guideStep1: "1. أدخل تاريخ بداية ونهاية الفصل الدراسي.",
            guideStep2: "2. (اختياري) أدخل وقت القيادة بالساعات والدقائق لإنشاء أحداث للقيادة في التقويم.",
            guideStep3: "3. (اختياري) يمكنك تغيير الإيموجي المخصص لكل مادة دراسية.",
            guideStep4: "4. اضغط على زر 'تحميل ICS' لتنزيل ملف التقويم.",
            guideStep5: "5. سيتم حفظ جميع الإعدادات تلقائيًا في المرة القادمة.",
            guideClose: "إغلاق",
            drivingTo: "القيادة إلى الجامعة",
            drivingFrom: "العودة للمنزل",
            ramadanMode: "وضع رمضان (تجريبي)",
        },
        en: {
            semesterStart: "Semester Start:",
            semesterEnd: "Semester End:",
            drivingTimeTo: "Time to College:",
            drivingTimeFrom: "Time Back Home:",
            hoursPlaceholder: "Hours",
            minutesPlaceholder: "Mins",
            drivingEmoji: "Driving Emoji:",
            downloadIcs: "Download ICS",
            guide: "Guide",
            reset: "Reset",
            language: "العربية",
            alertDates: "Please select the semester start and end dates first.",
            alertTable: "Schedule table not found!",
            guideTitle: "How to Use",
            guideStep1: "1. Select the start and end dates for the semester.",
            guideStep2: "2. (Optional) Enter the driving time in hours and minutes to create calendar events for your commute.",
            guideStep3: "3. (Optional) You can change the custom emoji for each course.",
            guideStep4: "4. Click the 'Download ICS' button to get the calendar file.",
            guideStep5: "5. All settings will be saved automatically for your next visit.",
            guideClose: "Close",
            drivingTo: "Driving to College",
            drivingFrom: "Driving Back Home",
            ramadanMode: "Ramadan Mode (Beta)",
        },
    };
    SchMakerApp.currentLanguage = "ar";
    SchMakerApp.byId = (id) => document.getElementById(id);
    SchMakerApp.byIdRequired = (id) => {
        const el = SchMakerApp.byId(id);
        if (!el)
            throw new Error(`Required element not found: ${id}`);
        return el;
    };
})(SchMakerApp || (SchMakerApp = {}));
var SchMakerApp;
(function (SchMakerApp) {
    function saveState() {
        const courseEmojis = {};
        document
            .querySelectorAll('input[id^="emoji-input-"]')
            .forEach((input) => {
            courseEmojis[input.id] = input.value;
        });
        const prefs = {
            lang: SchMakerApp.currentLanguage,
            values: {},
            courseEmojis,
        };
        document
            .querySelectorAll(".save-state")
            .forEach((el) => {
            prefs.values[el.id] = el.value;
        });
        localStorage.setItem(SchMakerApp.PREFS_KEY, JSON.stringify(prefs));
    }
    SchMakerApp.saveState = saveState;
    function loadState() {
        const savedPrefs = localStorage.getItem(SchMakerApp.PREFS_KEY);
        if (savedPrefs) {
            const parsed = JSON.parse(savedPrefs);
            SchMakerApp.currentLanguage = parsed.lang === "en" ? "en" : "ar";
            if (parsed.values) {
                Object.keys(parsed.values).forEach((id) => {
                    const el = SchMakerApp.byId(id);
                    if (el) {
                        el.value = parsed.values?.[id] ?? "";
                    }
                });
            }
            if (parsed.courseEmojis) {
                Object.keys(parsed.courseEmojis).forEach((inputId) => {
                    const input = SchMakerApp.byId(inputId);
                    if (input) {
                        input.value = parsed.courseEmojis?.[inputId] ?? input.value;
                    }
                });
            }
        }
        SchMakerApp.updateUIText();
    }
    SchMakerApp.loadState = loadState;
    function resetState(event) {
        event.preventDefault();
        if (confirm(SchMakerApp.currentLanguage === "ar"
            ? "هل أنت متأكد من أنك تريد إعادة تعيين جميع الإعدادات؟"
            : "Are you sure you want to reset all settings?")) {
            localStorage.removeItem(SchMakerApp.PREFS_KEY);
            location.reload();
        }
    }
    SchMakerApp.resetState = resetState;
})(SchMakerApp || (SchMakerApp = {}));
var SchMakerApp;
(function (SchMakerApp) {
    let stylesInjected = false;
    function injectStyles() {
        if (stylesInjected)
            return;
        const styleEl = document.createElement("style");
        styleEl.id = "schmaker-userscript-styles";
        styleEl.textContent = SchMakerApp.USERSCRIPT_CSS;
        document.head.appendChild(styleEl);
        stylesInjected = true;
    }
    function initializeScript() {
        const printButtonContainer = document.querySelector("a#myForm\\:printLink");
        if (!printButtonContainer) {
            console.log("Script anchor not found, exiting.");
            return;
        }
        injectStyles();
        const controlsContainer = document.createElement("div");
        controlsContainer.id = "custom-controls-container";
        controlsContainer.innerHTML = SchMakerApp.CONTROLS_HTML;
        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "sm-button-wrapper";
        const createButton = (id, clickHandler) => {
            const btn = printButtonContainer.cloneNode(true);
            btn.id = id;
            btn.href = "#";
            btn.onclick = clickHandler;
            btn.style.textDecoration = "none";
            return btn;
        };
        buttonWrapper.appendChild(createButton("downloadIcsBtn", SchMakerApp.parseAndDownloadIcs));
        buttonWrapper.appendChild(createButton("showGuideBtn", showGuide));
        buttonWrapper.appendChild(createButton("toggleLangBtn", toggleLanguage));
        buttonWrapper.appendChild(createButton("resetBtn", SchMakerApp.resetState));
        controlsContainer.appendChild(buttonWrapper);
        const semesterSelector = SchMakerApp.byId("myForm:selectSemester");
        if (!semesterSelector?.parentElement?.parentElement) {
            console.log("Semester selector not found, exiting.");
            return;
        }
        semesterSelector.parentElement.parentElement.insertAdjacentElement("afterend", controlsContainer);
        injectEmojiInputs();
        SchMakerApp.loadState();
        addSaveListeners();
    }
    SchMakerApp.initializeScript = initializeScript;
    function updateUIText() {
        const strings = SchMakerApp.uiStrings[SchMakerApp.currentLanguage];
        const isArabic = SchMakerApp.currentLanguage === "ar";
        SchMakerApp.byIdRequired("custom-controls-container").style.direction =
            isArabic ? "rtl" : "ltr";
        SchMakerApp.byIdRequired("labelSemesterStart").textContent = strings.semesterStart;
        SchMakerApp.byIdRequired("labelSemesterEnd").textContent = strings.semesterEnd;
        SchMakerApp.byIdRequired("labelDrivingTimeTo").textContent = strings.drivingTimeTo;
        SchMakerApp.byIdRequired("labelDrivingTimeFrom").textContent = strings.drivingTimeFrom;
        SchMakerApp.byIdRequired("labelDrivingEmoji").textContent = strings.drivingEmoji;
        SchMakerApp.byIdRequired("labelRamadanMode").textContent = strings.ramadanMode;
        SchMakerApp.byIdRequired("drivingTimeToHours").placeholder = strings.hoursPlaceholder;
        SchMakerApp.byIdRequired("drivingTimeToMinutes").placeholder = strings.minutesPlaceholder;
        SchMakerApp.byIdRequired("drivingTimeFromHours").placeholder = strings.hoursPlaceholder;
        SchMakerApp.byIdRequired("drivingTimeFromMinutes").placeholder = strings.minutesPlaceholder;
        const dl = document.querySelector("#downloadIcsBtn span");
        const gd = document.querySelector("#showGuideBtn span");
        const lg = document.querySelector("#toggleLangBtn span");
        const rs = document.querySelector("#resetBtn span");
        if (dl)
            dl.textContent = strings.downloadIcs;
        if (gd)
            gd.textContent = strings.guide;
        if (lg)
            lg.textContent = strings.language;
        if (rs)
            rs.textContent = strings.reset;
    }
    SchMakerApp.updateUIText = updateUIText;
    function toggleLanguage(event) {
        event.preventDefault();
        SchMakerApp.currentLanguage = SchMakerApp.currentLanguage === "ar" ? "en" : "ar";
        updateUIText();
        SchMakerApp.saveState();
    }
    SchMakerApp.toggleLanguage = toggleLanguage;
    function showGuide(event) {
        event.preventDefault();
        const strings = SchMakerApp.uiStrings[SchMakerApp.currentLanguage];
        const isArabic = SchMakerApp.currentLanguage === "ar";
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
            if (index === 4)
                li.style.fontWeight = "bold";
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
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay)
                document.body.removeChild(modalOverlay);
        };
        closeBtn.onclick = () => {
            document.body.removeChild(modalOverlay);
        };
    }
    SchMakerApp.showGuide = showGuide;
    function injectEmojiInputs() {
        const scheduleTable = SchMakerApp.byId("myForm:studScheduleTable");
        if (!scheduleTable)
            return;
        const defaultEmojis = ["📚", "💻", "🧪", "📈", "🧠", "💡", "✍️", "🗣️", "🌍", "🕌", "🔢", "⚛️", "📜", "⚖️", "🎨"];
        let emojiIndex = 0;
        const processedCourses = new Set();
        scheduleTable.querySelectorAll("tbody > tr").forEach((row) => {
            const courseCodeCell = row.querySelector('td[data-th="رمز المقرر"]');
            if (!courseCodeCell)
                return;
            const courseCode = courseCodeCell.innerText.trim().split("\n")[0] ?? "";
            if (!courseCode || processedCourses.has(courseCode))
                return;
            processedCourses.add(courseCode);
            const input = document.createElement("input");
            input.type = "text";
            input.id = `emoji-input-${courseCode.replace(/\s+/g, "-")}`;
            input.style.width = "40px";
            input.style.textAlign = "center";
            input.style.margin = "0 10px";
            input.style.border = "1px solid #ccc";
            input.style.borderRadius = "4px";
            input.value = defaultEmojis[emojiIndex % defaultEmojis.length];
            emojiIndex += 1;
            const centerTag = courseCodeCell.querySelector("center");
            if (centerTag)
                centerTag.appendChild(input);
            else
                courseCodeCell.appendChild(input);
        });
    }
    SchMakerApp.injectEmojiInputs = injectEmojiInputs;
    function addSaveListeners() {
        document
            .querySelectorAll('.save-state, input[id^="emoji-input-"]')
            .forEach((element) => {
            element.addEventListener("change", SchMakerApp.saveState);
        });
    }
    SchMakerApp.addSaveListeners = addSaveListeners;
})(SchMakerApp || (SchMakerApp = {}));
var SchMakerApp;
(function (SchMakerApp) {
    function parseSchedule() {
        const scheduleTable = SchMakerApp.byId("myForm:studScheduleTable");
        if (!scheduleTable)
            return null;
        const scheduleData = [];
        scheduleTable.querySelectorAll("tbody > tr").forEach((row) => {
            const cells = row.children;
            if (cells.length < 7)
                return;
            const courseCode = cells[0]?.textContent?.trim().split("\n")[0] ?? "";
            const courseName = cells[1]?.textContent?.trim() ?? "";
            const activity = cells[2]?.textContent?.trim() ?? "";
            const sectionNumber = cells[3]?.textContent?.trim() ?? "";
            const instructor = row.querySelector('input[id*=":instructor"]')?.value ?? "N/A";
            const rawSectionValue = row.querySelector('input[id*=":section"]')?.value ?? "";
            const scheduleEntries = rawSectionValue.split("@n").map((entry) => {
                const dayPart = (entry.split("@t")[0] ?? "").trim().replace(/\s+/g, " ");
                const timePart = (entry.split("@t")[1]?.split("@r")[0] ?? "").trim();
                const roomPart = (entry.split("@r")[1] ?? "").trim();
                const [startTime = "", endTime = ""] = timePart.split(" - ");
                const days = dayPart.split(" ").filter((d) => d.trim() !== "");
                return { days, startTime, endTime, room: roomPart };
            });
            scheduleData.push({ courseCode, courseName, activity, sectionNumber, instructor, schedule: scheduleEntries });
        });
        return scheduleData;
    }
    SchMakerApp.parseSchedule = parseSchedule;
    function parseAndDownloadIcs(event) {
        event.preventDefault();
        const strings = SchMakerApp.uiStrings[SchMakerApp.currentLanguage];
        const startDateStr = SchMakerApp.byIdRequired("semesterStart").value;
        const endDateStr = SchMakerApp.byIdRequired("semesterEnd").value;
        if (!startDateStr || !endDateStr) {
            alert(strings.alertDates);
            return;
        }
        const scheduleData = parseSchedule();
        if (!scheduleData) {
            alert(strings.alertTable);
            return;
        }
        const hTo = parseInt(SchMakerApp.byIdRequired("drivingTimeToHours").value, 10) || 0;
        const mTo = parseInt(SchMakerApp.byIdRequired("drivingTimeToMinutes").value, 10) || 0;
        const hFrom = parseInt(SchMakerApp.byIdRequired("drivingTimeFromHours").value, 10) || 0;
        const mFrom = parseInt(SchMakerApp.byIdRequired("drivingTimeFromMinutes").value, 10) || 0;
        const semesterStart = new Date(`${startDateStr}T00:00:00Z`);
        const semesterEnd = new Date(`${endDateStr}T23:59:59Z`);
        const studentName = SchMakerApp.byIdRequired("studNameText").innerText.trim();
        const drivingEmoji = SchMakerApp.byIdRequired("drivingEmoji").value || "🚗";
        const icsString = generateIcs(scheduleData, semesterStart, semesterEnd, hTo * 60 + mTo, hFrom * 60 + mFrom, drivingEmoji);
        downloadFile(`schedule_${studentName.replace(/\s/g, "_")}.ics`, icsString, "text/calendar");
    }
    SchMakerApp.parseAndDownloadIcs = parseAndDownloadIcs;
    function generateIcs(scheduleData, semesterStart, semesterEnd, drivingTimeTo, drivingTimeFrom, drivingEmoji) {
        const strings = SchMakerApp.uiStrings[SchMakerApp.currentLanguage];
        const toIcsDate = (date) => `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
        const dayMap = {
            "1": "SU",
            "2": "MO",
            "3": "TU",
            "4": "WE",
            "5": "TH",
            "6": "FR",
            "7": "SA",
        };
        const convertTo24Hour = (h, m, period) => {
            let hour = h;
            if (period.includes("م") && h !== 12)
                hour += 12;
            if (period.includes("ص") && h === 12)
                hour = 0;
            return [hour, m];
        };
        const getAdjustedTimes = (startStr, endStr) => {
            const isRamadan = SchMakerApp.byId("ramadanMode")?.value === "on";
            const sMatches = startStr.match(/\d+/g);
            const eMatches = endStr.match(/\d+/g);
            if (!sMatches || !eMatches || sMatches.length < 2 || eMatches.length < 2)
                return { start: 0, end: 0 };
            const [sH, sM] = sMatches.map(Number);
            const [eH, eM] = eMatches.map(Number);
            const [sHour, sMin] = convertTo24Hour(sH, sM, startStr);
            const [eHour, eMin] = convertTo24Hour(eH, eM, endStr);
            let startTotal = sHour * 60 + sMin;
            let endTotal = eHour * 60 + eMin;
            if (isRamadan) {
                const standardToSlot = { 8: 1, 9: 2, 10: 3, 11: 4, 13: 5, 14: 6, 15: 7, 16: 8 };
                const slot = standardToSlot[sHour];
                if (slot) {
                    const ramadanStartMins = slot <= 3 ? 10 * 60 + (slot - 1) * 40 : 750 + (slot - 4) * 40;
                    startTotal = ramadanStartMins;
                    endTotal = ramadanStartMins + 35;
                }
            }
            return { start: startTotal, end: endTotal };
        };
        const icsEvents = [];
        scheduleData.forEach((course) => {
            const sanitizedCode = course.courseCode.replace(/\s+/g, "-");
            const emoji = SchMakerApp.byId(`emoji-input-${sanitizedCode}`)?.value ?? "📚";
            course.schedule.forEach((entry) => {
                if (!entry.startTime || !entry.endTime)
                    return;
                const { start: startTotalMins, end: endTotalMins } = getAdjustedTimes(entry.startTime, entry.endTime);
                const startHour = Math.floor(startTotalMins / 60);
                const startMinute = startTotalMins % 60;
                const endHour = Math.floor(endTotalMins / 60);
                const endMinute = endTotalMins % 60;
                entry.days.forEach((dayIndex) => {
                    if (!dayMap[dayIndex])
                        return;
                    const dayOfWeek = parseInt(dayIndex, 10) - 1;
                    const firstEventDate = new Date(semesterStart.getTime());
                    while (firstEventDate.getUTCDay() !== dayOfWeek) {
                        firstEventDate.setUTCDate(firstEventDate.getUTCDate() + 1);
                    }
                    const datePart = `${firstEventDate.getUTCFullYear()}${(firstEventDate.getUTCMonth() + 1).toString().padStart(2, "0")}${firstEventDate.getUTCDate().toString().padStart(2, "0")}`;
                    const startTimePart = `${startHour.toString().padStart(2, "0")}${startMinute.toString().padStart(2, "0")}00`;
                    const endTimePart = `${endHour.toString().padStart(2, "0")}${endMinute.toString().padStart(2, "0")}00`;
                    const activityTypeEmoji = course.activity === "محاضرة" ? "📖" : course.activity === "تمارين" ? "🎯" : "";
                    icsEvents.push([
                        "BEGIN:VEVENT",
                        `DTSTAMP:${toIcsDate(new Date())}`,
                        `UID:${sanitizedCode}-${entry.days.join("")}-${Date.now()}${Math.random()}`,
                        `DTSTART;TZID=Asia/Riyadh:${datePart}T${startTimePart}`,
                        `DTEND;TZID=Asia/Riyadh:${datePart}T${endTimePart}`,
                        `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
                        `SUMMARY:${`${course.courseCode} ${emoji}${activityTypeEmoji}`.trim()}`,
                        `LOCATION:${entry.room}`,
                        `DESCRIPTION:${course.courseName}\\nSection: ${course.sectionNumber}\\nInstructor: ${course.instructor}`,
                        "END:VEVENT",
                    ].join("\n"));
                });
            });
        });
        if (drivingTimeTo > 0 || drivingTimeFrom > 0) {
            const dailyBounds = {};
            scheduleData.forEach((course) => {
                course.schedule.forEach((entry) => {
                    const { start, end } = getAdjustedTimes(entry.startTime, entry.endTime);
                    entry.days.forEach((dayIndex) => {
                        if (!dailyBounds[dayIndex])
                            dailyBounds[dayIndex] = { start, end };
                        else {
                            if (start < dailyBounds[dayIndex].start)
                                dailyBounds[dayIndex].start = start;
                            if (end > dailyBounds[dayIndex].end)
                                dailyBounds[dayIndex].end = end;
                        }
                    });
                });
            });
            Object.keys(dailyBounds).forEach((dayIndex) => {
                const bounds = dailyBounds[dayIndex];
                const dayOfWeek = parseInt(dayIndex, 10) - 1;
                const firstEventDate = new Date(semesterStart.getTime());
                while (firstEventDate.getUTCDay() !== dayOfWeek) {
                    firstEventDate.setUTCDate(firstEventDate.getUTCDate() + 1);
                }
                const createDrivingEvent = (title, baseTimeMinutes, offsetMinutes, isDrivingTo) => {
                    if (offsetMinutes <= 0)
                        return;
                    const startTime = new Date(firstEventDate.getTime());
                    const endTime = new Date(firstEventDate.getTime());
                    if (isDrivingTo) {
                        startTime.setUTCHours(0, baseTimeMinutes - offsetMinutes, 0, 0);
                        endTime.setUTCHours(0, baseTimeMinutes, 0, 0);
                    }
                    else {
                        startTime.setUTCHours(0, baseTimeMinutes, 0, 0);
                        endTime.setUTCHours(0, baseTimeMinutes + offsetMinutes, 0, 0);
                    }
                    const formatDate = (d) => `${d.getUTCFullYear()}${(d.getUTCMonth() + 1).toString().padStart(2, "0")}${d.getUTCDate().toString().padStart(2, "0")}`;
                    const formatTime = (d) => `${d.getUTCHours().toString().padStart(2, "0")}${d.getUTCMinutes().toString().padStart(2, "0")}00`;
                    icsEvents.push([
                        "BEGIN:VEVENT",
                        `DTSTAMP:${toIcsDate(new Date())}`,
                        `UID:DRIVING-${dayIndex}-${isDrivingTo ? "TO" : "FROM"}-${Date.now()}`,
                        `DTSTART;TZID=Asia/Riyadh:${formatDate(startTime)}T${formatTime(startTime)}`,
                        `DTEND;TZID=Asia/Riyadh:${formatDate(endTime)}T${formatTime(endTime)}`,
                        `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
                        `SUMMARY:${drivingEmoji} ${title}`,
                        "TRANSP:TRANSPARENT",
                        "END:VEVENT",
                    ].join("\n"));
                };
                createDrivingEvent(strings.drivingTo, bounds.start, drivingTimeTo, true);
                createDrivingEvent(strings.drivingFrom, bounds.end, drivingTimeFrom, false);
            });
        }
        return [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//YourScript//PSAU Schedule to ICS//EN",
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
    SchMakerApp.generateIcs = generateIcs;
    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    SchMakerApp.downloadFile = downloadFile;
})(SchMakerApp || (SchMakerApp = {}));
