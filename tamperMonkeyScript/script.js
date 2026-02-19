// ==UserScript==
// @name         PSAU Schedule to ICS Downloader (with Saving & Reset)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds a control panel to download the course schedule as an ICS file. Remembers all your settings. Features an Arabic UI, language toggle, and a user guide.
// @author       You
// @match        https://eserve.psau.edu.sa/ku/ui/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const PREFS_KEY = "psauSchedulePrefs";

  // --- 0. Language Strings & State ---
  const uiStrings = {
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
      guideStep2:
        "2. (اختياري) أدخل وقت القيادة بالساعات والدقائق لإنشاء أحداث للقيادة في التقويم.",
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
      guideStep2:
        "2. (Optional) Enter the driving time in hours and minutes to create calendar events for your commute.",
      guideStep3:
        "3. (Optional) You can change the custom emoji for each course.",
      guideStep4:
        "4. Click the 'Download ICS' button to get the calendar file.",
      guideStep5:
        "5. All settings will be saved automatically for your next visit.",
      guideClose: "Close",
      drivingTo: "Driving to College",
      drivingFrom: "Driving Back Home",
      ramadanMode: "Ramadan Mode (Beta)",
    },
  };
  let currentLanguage = "ar"; // Default language

  function initializeScript() {
    const printButtonContainer = document.querySelector("a#myForm\\:printLink");
    if (!printButtonContainer) {
      console.log("Script anchor not found, exiting.");
      return;
    }

    // --- 1. Create and inject the entire control panel ---
    const controlsContainer = document.createElement("div");
    controlsContainer.id = "custom-controls-container";
    controlsContainer.style.display = "flex";
    controlsContainer.style.flexWrap = "wrap";
    controlsContainer.style.alignItems = "flex-end";
    controlsContainer.style.gap = "15px";
    controlsContainer.style.padding = "10px";
    controlsContainer.style.marginTop = "10px";
    controlsContainer.style.border = "1px solid #ddd";
    controlsContainer.style.borderRadius = "5px";
    controlsContainer.style.backgroundColor = "#f9f9f9";

    controlsContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; font-size: 12px;">
                <label for="semesterStart" id="labelSemesterStart" style="font-weight: bold; margin-bottom: 5px;"></label>
                <input type="date" id="semesterStart" class="save-state" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div style="display: flex; flex-direction: column; font-size: 12px;">
                <label for="semesterEnd" id="labelSemesterEnd" style="font-weight: bold; margin-bottom: 5px;"></label>
                <input type="date" id="semesterEnd" class="save-state" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div style="display: flex; flex-direction: column; font-size: 12px;">
                <label id="labelDrivingTimeTo" style="font-weight: bold; margin-bottom: 5px;"></label>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <input type="number" id="drivingTimeToHours" class="save-state" min="0" style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                    <input type="number" id="drivingTimeToMinutes" class="save-state" min="0" max="59" style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
            </div>
            <div style="display: flex; flex-direction: column; font-size: 12px;">
                <label id="labelDrivingTimeFrom" style="font-weight: bold; margin-bottom: 5px;"></label>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <input type="number" id="drivingTimeFromHours" class="save-state" min="0" style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                    <input type="number" id="drivingTimeFromMinutes" class="save-state" min="0" max="59" style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
            </div>
            <div style="display: flex; flex-direction: column; font-size: 12px;">
                <label for="drivingEmoji" id="labelDrivingEmoji" style="font-weight: bold; margin-bottom: 5px;"></label>
                <input type="text" id="drivingEmoji" class="save-state" value="🚗" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px; width: 50px; text-align: center;">
            </div>
            <div style="display: flex; flex-direction: column; font-size: 12px;">
                <label id="labelRamadanMode" for="ramadanMode" style="font-weight: bold; margin-bottom: 5px;">Ramadan Mode</label>
                <select id="ramadanMode" class="save-state" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="off">Off</option>
                    <option value="on">On</option>
                </select>
            </div>
        `;

    const buttonWrapper = document.createElement("div");
    buttonWrapper.style.display = "flex";
    buttonWrapper.style.gap = "10px";
    buttonWrapper.style.marginLeft = "auto";

    const createButton = (id, clickHandler) => {
      const btn = printButtonContainer.cloneNode(true);
      btn.id = id;
      btn.href = "#";
      btn.onclick = clickHandler;
      btn.style.textDecoration = "none";
      return btn;
    };

    const icsBtn = createButton("downloadIcsBtn", parseAndDownloadIcs);
    const guideBtn = createButton("showGuideBtn", showGuide);
    const langBtn = createButton("toggleLangBtn", toggleLanguage);
    const resetBtn = createButton("resetBtn", resetState);

    buttonWrapper.appendChild(icsBtn);
    buttonWrapper.appendChild(guideBtn);
    buttonWrapper.appendChild(langBtn);
    buttonWrapper.appendChild(resetBtn);
    controlsContainer.appendChild(buttonWrapper);

    const semesterSelector = document.getElementById("myForm:selectSemester");
    semesterSelector.parentElement.parentElement.insertAdjacentElement(
      "afterend",
      controlsContainer,
    );

    // Run the rest of the setup
    injectEmojiInputs();
    loadState();
    addSaveListeners();
  }

  // --- 2. State Management (Save, Load, Reset) ---
  function saveState() {
    const courseEmojis = {};
    document.querySelectorAll('input[id^="emoji-input-"]').forEach((input) => {
      courseEmojis[input.id] = input.value;
    });

    const prefs = {
      lang: currentLanguage,
      values: {},
    };

    document.querySelectorAll(".save-state").forEach((el) => {
      prefs.values[el.id] = el.value;
    });

    prefs.courseEmojis = courseEmojis;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  function loadState() {
    const savedPrefs = localStorage.getItem(PREFS_KEY);
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      currentLanguage = prefs.lang || "ar";

      if (prefs.values) {
        Object.keys(prefs.values).forEach((id) => {
          const el = document.getElementById(id);
          if (el) {
            el.value = prefs.values[id];
          }
        });
      }

      if (prefs.courseEmojis) {
        Object.keys(prefs.courseEmojis).forEach((inputId) => {
          const input = document.getElementById(inputId);
          if (input) {
            input.value = prefs.courseEmojis[inputId];
          }
        });
      }
    }
    updateUIText();
  }

  function resetState(event) {
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

  // --- 3. UI Text & Language Logic ---
  function updateUIText() {
    const strings = uiStrings[currentLanguage];
    const isArabic = currentLanguage === "ar";
    document.getElementById("custom-controls-container").style.direction =
      isArabic ? "rtl" : "ltr";
    document.getElementById("labelSemesterStart").textContent =
      strings.semesterStart;
    document.getElementById("labelSemesterEnd").textContent =
      strings.semesterEnd;
    document.getElementById("labelDrivingTimeTo").textContent =
      strings.drivingTimeTo;
    document.getElementById("labelDrivingTimeFrom").textContent =
      strings.drivingTimeFrom;
    document.getElementById("labelDrivingEmoji").textContent =
      strings.drivingEmoji;
    document.getElementById("labelRamadanMode").textContent =
      strings.ramadanMode;
    document.getElementById("drivingTimeToHours").placeholder =
      strings.hoursPlaceholder;
    document.getElementById("drivingTimeToMinutes").placeholder =
      strings.minutesPlaceholder;
    document.getElementById("drivingTimeFromHours").placeholder =
      strings.hoursPlaceholder;
    document.getElementById("drivingTimeFromMinutes").placeholder =
      strings.minutesPlaceholder;
    document.querySelector("#downloadIcsBtn span").textContent =
      strings.downloadIcs;
    document.querySelector("#showGuideBtn span").textContent = strings.guide;
    document.querySelector("#toggleLangBtn span").textContent =
      strings.language;
    document.querySelector("#resetBtn span").textContent = strings.reset;
  }

  function toggleLanguage(event) {
    event.preventDefault();
    currentLanguage = currentLanguage === "ar" ? "en" : "ar";
    updateUIText();
    saveState();
  }

  // --- 4. Guide Modal Logic ---
  function showGuide(event) {
    event.preventDefault();
    const strings = uiStrings[currentLanguage];
    const isArabic = currentLanguage === "ar";

    const modalOverlay = document.createElement("div");
    modalOverlay.style.position = "fixed";
    modalOverlay.style.top = "0";
    modalOverlay.style.left = "0";
    modalOverlay.style.width = "100%";
    modalOverlay.style.height = "100%";
    modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    modalOverlay.style.zIndex = "10000";
    modalOverlay.style.display = "flex";
    modalOverlay.style.justifyContent = "center";
    modalOverlay.style.alignItems = "center";

    const modalContent = document.createElement("div");
    modalContent.style.backgroundColor = "#fff";
    modalContent.style.padding = "25px";
    modalContent.style.borderRadius = "8px";
    modalContent.style.maxWidth = "500px";
    modalContent.style.width = "90%";
    modalContent.style.textAlign = isArabic ? "right" : "left";
    modalContent.style.direction = isArabic ? "rtl" : "ltr";
    modalContent.style.fontFamily = "Arial, sans-serif";

    modalContent.innerHTML = `
            <h2 style="margin-top: 0; color: #333;">${strings.guideTitle}</h2>
            <ol style="padding-${isArabic ? "right" : "left"}: 20px; line-height: 1.6;">
                <li>${strings.guideStep1}</li>
                <li>${strings.guideStep2}</li>
                <li>${strings.guideStep3}</li>
                <li>${strings.guideStep4}</li>
                <li style="font-weight: bold;">${strings.guideStep5}</li>
            </ol>
            <button id="guideCloseBtn" style="padding: 10px 20px; border: none; background-color: #007bff; color: white; border-radius: 5px; cursor: pointer; float: ${isArabic ? "left" : "right"};">${strings.guideClose}</button>
        `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    modalOverlay.onclick = function (e) {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
      }
    };
    document.getElementById("guideCloseBtn").onclick = function () {
      document.body.removeChild(modalOverlay);
    };
  }

  // --- 5. Dynamically inject emoji input fields ---
  function injectEmojiInputs() {
    const scheduleTable = document.getElementById("myForm:studScheduleTable");
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
    const processedCourses = new Set();
    const tableRows = scheduleTable.querySelectorAll("tbody > tr");
    tableRows.forEach((row) => {
      const courseCodeCell = row.querySelector('td[data-th="رمز المقرر"]');
      if (!courseCodeCell) return;
      const courseCode = courseCodeCell.innerText.trim().split("\n")[0];
      if (courseCode && !processedCourses.has(courseCode)) {
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
        emojiIndex++;
        const centerTag = courseCodeCell.querySelector("center");
        if (centerTag) {
          centerTag.appendChild(input);
        } else {
          courseCodeCell.appendChild(input); // Fallback
        }
      }
    });
  }

  // --- 6. Event Listener Setup ---
  function addSaveListeners() {
    document
      .querySelectorAll('.save-state, input[id^="emoji-input-"]')
      .forEach((element) => {
        element.addEventListener("change", saveState);
      });
  }

  // --- 7. Schedule Parsing and ICS Generation ---
  function parseSchedule() {
    const scheduleTable = document.getElementById("myForm:studScheduleTable");
    if (!scheduleTable) return null;
    const scheduleData = [];
    const tableRows = scheduleTable.querySelectorAll("tbody > tr");
    tableRows.forEach((row) => {
      // Use .children to get only direct columns (ignores nested tables)
      const cells = row.children;
      if (cells.length < 7) return;
      const courseCode = cells[0].innerText.trim().split("\n")[0];
      const courseName = cells[1].innerText.trim();
      const activity = cells[2].innerText.trim();
      const sectionNumber = cells[3].innerText.trim();
      const instructor =
        row.querySelector('input[id*=":instructor"]')?.value || "N/A";
      const rawSectionValue =
        row.querySelector('input[id*=":section"]')?.value || "";
      const scheduleEntries = rawSectionValue.split("@n").map((entry) => {
        const dayPart = (entry.split("@t")[0] || "")
          .trim()
          .replace(/\s+/g, " ");
        const timePart = (entry.split("@t")[1]?.split("@r")[0] || "").trim();
        const roomPart = (entry.split("@r")[1] || "").trim();
        const [startTime, endTime] = timePart.split(" - ");
        const days = dayPart.split(" ").filter((d) => d.trim() !== "");
        return { days, startTime, endTime, room: roomPart };
      });
      scheduleData.push({
        courseCode,
        courseName,
        activity,
        sectionNumber,
        instructor,
        schedule: scheduleEntries,
      });
    });
    return scheduleData;
  }

  function parseAndDownloadIcs(event) {
    event.preventDefault();
    const strings = uiStrings[currentLanguage];
    const startDateStr = document.getElementById("semesterStart").value;
    const endDateStr = document.getElementById("semesterEnd").value;
    if (!startDateStr || !endDateStr) {
      alert(strings.alertDates);
      return;
    }
    const scheduleData = parseSchedule();
    if (!scheduleData) {
      alert(strings.alertTable);
      return;
    }
    const hTo =
      parseInt(document.getElementById("drivingTimeToHours").value, 10) || 0;
    const mTo =
      parseInt(document.getElementById("drivingTimeToMinutes").value, 10) || 0;
    const drivingTimeTo = hTo * 60 + mTo;
    const hFrom =
      parseInt(document.getElementById("drivingTimeFromHours").value, 10) || 0;
    const mFrom =
      parseInt(document.getElementById("drivingTimeFromMinutes").value, 10) ||
      0;
    const drivingTimeFrom = hFrom * 60 + mFrom;
    const semesterStart = new Date(startDateStr + "T00:00:00Z");
    const semesterEnd = new Date(endDateStr + "T23:59:59Z");
    const studentName = document
      .getElementById("studNameText")
      .innerText.trim();
    const drivingEmoji = document.getElementById("drivingEmoji").value || "🚗";
    const icsString = generateIcs(
      scheduleData,
      semesterStart,
      semesterEnd,
      drivingTimeTo,
      drivingTimeFrom,
      drivingEmoji,
    );
    downloadFile(
      `schedule_${studentName.replace(/\s/g, "_")}.ics`,
      icsString,
      "text/calendar",
    );
  }

  function generateIcs(
    scheduleData,
    semesterStart,
    semesterEnd,
    drivingTimeTo,
    drivingTimeFrom,
    drivingEmoji,
  ) {
    const strings = uiStrings[currentLanguage];
    const toIcsDate = (date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dayMap = {
      1: "SU",
      2: "MO",
      3: "TU",
      4: "WE",
      5: "TH",
      6: "FR",
      7: "SA",
    };
    let icsEvents = [];
    const convertTo24Hour = (h, m, period) => {
      let hour = h;
      if (period.includes("م") && h !== 12) hour += 12;
      if (period.includes("ص") && h === 12) hour = 0;
      return [hour, m];
    };
    const timeStringToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.match(/\d+/g).map(Number);
      const [hour] = convertTo24Hour(h, m, timeStr);
      return hour * 60 + m;
    };
    scheduleData.forEach((course) => {
      const sanitizedCode = course.courseCode.replace(/\s+/g, "-");
      const emojiInput = document.getElementById(
        `emoji-input-${sanitizedCode}`,
      );
      const emoji = emojiInput ? emojiInput.value : "📚";
      course.schedule.forEach((entry) => {
        if (!entry.startTime || !entry.endTime) return;
        const [startH, startM] = entry.startTime.match(/\d+/g).map(Number);
        const [endH, endM] = entry.endTime.match(/\d+/g).map(Number);
        const [startHour, startMinute] = convertTo24Hour(
          startH,
          startM,
          entry.startTime,
        );
        let [endHour, endMinute] = convertTo24Hour(endH, endM, entry.endTime);

        // RAMADAN ALGORITHM START
        const isRamadan = document.getElementById("ramadanMode")?.value === "on";
        let finalStartHour = startHour;
        let finalStartMinute = startMinute;
        let finalEndHour = endHour;
        let finalEndMinute = endMinute;

        if (isRamadan) {
          // Map Standard Start Hour (24h) to Slot Index
          // 8->1, 9->2, 10->3, 11->4, 13->5, 14->6, 15->7, 16->8
          const standardToSlot = {
            8: 1,
            9: 2,
            10: 3,
            11: 4,
            13: 5,
            14: 6,
            15: 7,
            16: 8,
          };

          if (standardToSlot[startHour]) {
            const slot = standardToSlot[startHour];
            let totalRamadanMinutes = 0;

            if (slot <= 3) {
              // Morning: 10:00 AM + (Slot-1)*40 mins
              totalRamadanMinutes = 10 * 60 + (slot - 1) * 40;
            } else {
              // Afternoon: 12:30 PM + (Slot-4)*40 mins
              // 12:30 PM = 750 minutes
              totalRamadanMinutes = 750 + (slot - 4) * 40;
            }

            // Calculate new Start Time
            finalStartHour = Math.floor(totalRamadanMinutes / 60);
            finalStartMinute = totalRamadanMinutes % 60;

            // Calculate new End Time (Duration fixed to 35 mins per university note)
            const endMinutes = totalRamadanMinutes + 35;
            finalEndHour = Math.floor(endMinutes / 60);
            finalEndMinute = endMinutes % 60;
          }
        }
        // RAMADAN ALGORITHM END

        entry.days.forEach((dayIndex) => {
          if (!dayMap[dayIndex]) return;
          const dayOfWeek = parseInt(dayIndex, 10) - 1;
          let firstEventDate = new Date(semesterStart.getTime());
          while (firstEventDate.getUTCDay() !== dayOfWeek) {
            firstEventDate.setUTCDate(firstEventDate.getUTCDate() + 1);
          }
          const datePart = `${firstEventDate.getUTCFullYear()}${(firstEventDate.getUTCMonth() + 1).toString().padStart(2, "0")}${firstEventDate.getUTCDate().toString().padStart(2, "0")}`;
          const startTimePart = `${finalStartHour.toString().padStart(2, "0")}${finalStartMinute.toString().padStart(2, "0")}00`;
          const endTimePart = `${finalEndHour.toString().padStart(2, "0")}${finalEndMinute.toString().padStart(2, "0")}00`;
          const activityTypeEmoji =
            course.activity === "محاضرة"
              ? "📖"
              : course.activity === "تمارين"
                ? "🎯"
                : "";
          const summary =
            `${course.courseCode} ${emoji}${activityTypeEmoji}`.trim();
          const description = `${course.courseName}\\nSection: ${course.sectionNumber}\\nInstructor: ${course.instructor}`;
          icsEvents.push(
            [
              "BEGIN:VEVENT",
              `DTSTAMP:${toIcsDate(new Date())}`,
              `UID:${sanitizedCode}-${entry.days.join("")}-${Date.now()}${Math.random()}`,
              `DTSTART;TZID=Asia/Riyadh:${datePart}T${startTimePart}`,
              `DTEND;TZID=Asia/Riyadh:${datePart}T${endTimePart}`,
              `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
              `SUMMARY:${summary}`,
              `LOCATION:${entry.room}`,
              `DESCRIPTION:${description}`,
              "END:VEVENT",
            ].join("\n"),
          );
        });
      });
    });
    if (drivingTimeTo > 0 || drivingTimeFrom > 0) {
      const dailyBounds = {};
      scheduleData.forEach((course) => {
        course.schedule.forEach((entry) => {
          const startTimeInMinutes = timeStringToMinutes(entry.startTime);
          const endTimeInMinutes = timeStringToMinutes(entry.endTime);
          entry.days.forEach((dayIndex) => {
            if (!dailyBounds[dayIndex]) {
              dailyBounds[dayIndex] = {
                start: startTimeInMinutes,
                end: endTimeInMinutes,
              };
            } else {
              if (startTimeInMinutes < dailyBounds[dayIndex].start)
                dailyBounds[dayIndex].start = startTimeInMinutes;
              if (endTimeInMinutes > dailyBounds[dayIndex].end)
                dailyBounds[dayIndex].end = endTimeInMinutes;
            }
          });
        });
      });
      for (const dayIndex in dailyBounds) {
        const bounds = dailyBounds[dayIndex];
        const dayOfWeek = parseInt(dayIndex, 10) - 1;
        let firstEventDate = new Date(semesterStart.getTime());
        while (firstEventDate.getUTCDay() !== dayOfWeek) {
          firstEventDate.setUTCDate(firstEventDate.getUTCDate() + 1);
        }
        const createDrivingEvent = (
          title,
          baseTimeMinutes,
          offsetMinutes,
          isDrivingTo,
        ) => {
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
          const formatDate = (d) =>
            `${d.getUTCFullYear()}${(d.getUTCMonth() + 1).toString().padStart(2, "0")}${d.getUTCDate().toString().padStart(2, "0")}`;
          const formatTime = (d) =>
            `${d.getUTCHours().toString().padStart(2, "0")}${d.getUTCMinutes().toString().padStart(2, "0")}00`;
          const dtStart = `${formatDate(startTime)}T${formatTime(startTime)}`;
          const dtEnd = `${formatDate(endTime)}T${formatTime(endTime)}`;
          icsEvents.push(
            [
              "BEGIN:VEVENT",
              `DTSTAMP:${toIcsDate(new Date())}`,
              `UID:DRIVING-${dayIndex}-${isDrivingTo ? "TO" : "FROM"}-${Date.now()}`,
              `DTSTART;TZID=Asia/Riyadh:${dtStart}`,
              `DTEND;TZID=Asia/Riyadh:${dtEnd}`,
              `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
              `SUMMARY:${drivingEmoji} ${title}`,
              "TRANSP:TRANSPARENT",
              "END:VEVENT",
            ].join("\n"),
          );
        };
        createDrivingEvent(
          strings.drivingTo,
          bounds.start,
          drivingTimeTo,
          true,
        );
        createDrivingEvent(
          strings.drivingFrom,
          bounds.end,
          drivingTimeFrom,
          false,
        );
      }
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

  // --- 8. Generic file download function ---
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- 9. Run the script ---
  // MODIFICATION: Use a MutationObserver to wait for the page to dynamically
  // load the schedule table before trying to inject the script's UI.
  const observer = new MutationObserver((mutations, obs) => {
    // We are looking for the print link which appears with the schedule table.
    const anchorElement = document.querySelector("a#myForm\\:printLink");
    if (anchorElement) {
      obs.disconnect(); // Stop observing now that we found the element
      initializeScript(); // Run the main part of our script
    }
  });

  // Start observing the body for changes to its direct children and their descendants.
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
