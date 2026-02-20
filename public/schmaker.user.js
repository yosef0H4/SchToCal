// ==UserScript==
// @name         Schedule to ICS Downloader (with Saving & Reset)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Adds a control panel to download the course schedule as an ICS file. Remembers all your settings. Features an Arabic UI, language toggle, and a user guide.
// @author       You
// @match        https://eserve.psau.edu.sa/ku/ui/*
// @grant        none
// ==/UserScript==
"use strict";
(() => {
  // src/core/strings.ts
  var uiStrings = {
    ar: {
      semesterStart: "\u0628\u062F\u0627\u064A\u0629 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A:",
      semesterEnd: "\u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A:",
      drivingTimeTo: "\u0627\u0644\u0648\u0642\u062A \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u062C\u0627\u0645\u0639\u0629:",
      drivingTimeFrom: "\u0627\u0644\u0648\u0642\u062A \u0644\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u0645\u0646\u0632\u0644:",
      hoursPlaceholder: "\u0633\u0627\u0639\u0629",
      minutesPlaceholder: "\u062F\u0642\u064A\u0642\u0629",
      drivingEmoji: "\u0625\u064A\u0645\u0648\u062C\u064A \u0627\u0644\u0642\u064A\u0627\u062F\u0629:",
      downloadIcs: "\u062A\u062D\u0645\u064A\u0644 ICS",
      downloadTampermonkey: "\u062A\u062D\u0645\u064A\u0644 \u0633\u0643\u0631\u064A\u0628\u062A \u062A\u0645\u0628\u0631\u0645\u0627\u0646\u0643\u064A",
      syncGoogleCalendar: "\u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0639 \u062A\u0642\u0648\u064A\u0645 Google",
      syncGoogleUnavailable: "\u0623\u0636\u0641 VITE_GOOGLE_CLIENT_ID \u0644\u062A\u0641\u0639\u064A\u0644 \u0645\u0632\u0627\u0645\u0646\u0629 Google.",
      syncGoogleWorking: "\u062C\u0627\u0631\u064A \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0639 Google Calendar...",
      syncGoogleDone: "\u0627\u0643\u062A\u0645\u0644\u062A \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629: \u062A\u0645 \u062D\u0630\u0641 {deleted} \u0648\u0625\u0636\u0627\u0641\u0629 {inserted} \u062D\u062F\u062B.",
      syncGoogleFailed: "\u0641\u0634\u0644\u062A \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0639 Google Calendar.",
      guide: "\u062F\u0644\u064A\u0644",
      reset: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646",
      language: "English",
      alertDates: "\u0627\u0644\u0631\u062C\u0627\u0621 \u062A\u062D\u062F\u064A\u062F \u062A\u0627\u0631\u064A\u062E \u0628\u062F\u0627\u064A\u0629 \u0648\u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0623\u0648\u0644\u0627\u064B.",
      alertTable: "\u062C\u062F\u0648\u0644 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F!",
      guideTitle: "\u062F\u0644\u064A\u0644 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645",
      guideStep1: "1. \u0627\u0641\u062A\u062D https://eserve.psau.edu.sa/ku/ui/student/homeIndex.faces \u0648\u0633\u062C\u0651\u0644 \u0627\u0644\u062F\u062E\u0648\u0644.",
      guideStep2: "2. \u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0635\u0641\u062D\u0629 '\u0627\u0644\u0645\u0642\u0631\u0631\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629'.",
      guideStep3: "3. \u0627\u0636\u063A\u0637 Ctrl+S (\u0623\u0648 \u0643\u0644\u0643 \u064A\u0645\u064A\u0646 > \u062D\u0641\u0638 \u0628\u0627\u0633\u0645) \u0648\u0627\u062D\u0641\u0638 \u0627\u0644\u0635\u0641\u062D\u0629 \u0643\u0645\u0644\u0641 HTML.",
      guideStep4: "4. \u0627\u0631\u0641\u0639 \u0645\u0644\u0641 HTML \u0647\u0646\u0627 \u0641\u064A SchMaker.",
      guideStep5: "5. \u0639\u062F\u0651\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u062B\u0645 \u0646\u0632\u0651\u0644 ICS \u0623\u0648 \u0627\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0639 Google.",
      guideClose: "\u0625\u063A\u0644\u0627\u0642",
      drivingTo: "\u0627\u0644\u0642\u064A\u0627\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u062C\u0627\u0645\u0639\u0629",
      drivingFrom: "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u0645\u0646\u0632\u0644",
      ramadanSchedule: "\u062C\u062F\u0648\u0644 \u0631\u0645\u0636\u0627\u0646:",
      ramadanOff: "\u0628\u062F\u0648\u0646 \u062A\u0639\u062F\u064A\u0644",
      ramadanEngineering: "\u0627\u0644\u0647\u0646\u062F\u0633\u0629",
      ramadanFirstYear: "\u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u062A\u062D\u0636\u064A\u0631\u064A\u0629",
      uploadTitle: "\u0627\u0631\u0641\u0639 \u0645\u0644\u0641 \u0627\u0644\u062C\u062F\u0648\u0644 (HTML)",
      uploadHint: "\u0627\u0641\u062A\u062D \u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0642\u0631\u0631\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u062B\u0645 \u0627\u062D\u0641\u0638\u0647\u0627 HTML \u0648\u0627\u0631\u0641\u0639\u0647\u0627 \u0647\u0646\u0627.",
      uploadButton: "\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0644\u0641 HTML",
      uploadInvalid: "\u0627\u0644\u0645\u0644\u0641 \u0644\u0627 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062C\u062F\u0648\u0644 \u0635\u0627\u0644\u062D.",
      selectedFile: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u062D\u062F\u062F:",
      noFile: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0644\u0641",
      generatePreview: "\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062C\u062F\u0648\u0644",
      themeTitle: "\u0627\u0644\u062C\u062F\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u062A\u0642\u0648\u064A\u0645",
      settingsTitle: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      previewTitle: "\u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629",
      previewEmptyHint: "\u0627\u0631\u0641\u0639 \u0645\u0644\u0641 \u0627\u0644\u062C\u062F\u0648\u0644 HTML \u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629."
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
      downloadTampermonkey: "Download Tampermonkey Script",
      syncGoogleCalendar: "Sync to Google Calendar",
      syncGoogleUnavailable: "Set VITE_GOOGLE_CLIENT_ID to enable Google sync.",
      syncGoogleWorking: "Syncing with Google Calendar...",
      syncGoogleDone: "Sync complete: deleted {deleted}, inserted {inserted} events.",
      syncGoogleFailed: "Google Calendar sync failed.",
      guide: "Guide",
      reset: "Reset",
      language: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      alertDates: "Please select the semester start and end dates first.",
      alertTable: "Schedule table not found!",
      guideTitle: "How to Use",
      guideStep1: "1. Open https://eserve.psau.edu.sa/ku/ui/student/homeIndex.faces and sign in.",
      guideStep2: "2. Go to the 'Registered Courses' page (\u0627\u0644\u0645\u0642\u0631\u0631\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629).",
      guideStep3: "3. Press Ctrl+S (or right-click > Save as) and save the page as HTML.",
      guideStep4: "4. Upload that HTML file here in SchMaker.",
      guideStep5: "5. Adjust settings, then download ICS or sync to Google Calendar.",
      guideClose: "Close",
      drivingTo: "Driving to College",
      drivingFrom: "Driving Back Home",
      ramadanSchedule: "Ramadan Schedule:",
      ramadanOff: "No Ramadan Schedule",
      ramadanEngineering: "Engineering",
      ramadanFirstYear: "1st Year",
      uploadTitle: "Upload Schedule HTML",
      uploadHint: "Open Registered Courses, save as HTML, then upload it here.",
      uploadButton: "Choose HTML File",
      uploadInvalid: "Uploaded file does not contain a valid schedule table.",
      selectedFile: "Selected file:",
      noFile: "No file selected",
      generatePreview: "Parse Schedule",
      themeTitle: "Schedule to Calendar",
      settingsTitle: "Settings",
      previewTitle: "Preview",
      previewEmptyHint: "Upload your schedule HTML to preview."
    }
  };

  // src/core/ics.ts
  function toIcsDate(date) {
    return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
  }
  function convertTo24Hour(h, m, period) {
    let hour = h;
    if (period.includes("\u0645") && h !== 12) hour += 12;
    if (period.includes("\u0635") && h === 12) hour = 0;
    return [hour, m];
  }
  function durationMinutes(startTotal, endTotal) {
    return endTotal >= startTotal ? endTotal - startTotal : endTotal + 1440 - startTotal;
  }
  function getAdjustedTimesInMinutes(startStr, endStr, ramadanMode) {
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
      const engineeringStarts = {
        8: 10 * 60,
        9: 10 * 60 + 40,
        10: 11 * 60 + 20,
        11: 12 * 60 + 30,
        13: 13 * 60 + 10,
        14: 13 * 60 + 50,
        15: 14 * 60 + 30,
        16: 15 * 60 + 10
      };
      const firstYearStarts = {
        13: 21 * 60 + 30,
        14: 22 * 60 + 10,
        15: 22 * 60 + 50,
        16: 23 * 60 + 30,
        17: 10,
        18: 50,
        19: 90
      };
      const mappedStart = ramadanMode === "engineering" ? engineeringStarts[sHour] : firstYearStarts[sHour];
      if (mappedStart !== void 0) {
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
  function toIcsLocalDateTimeParts(baseDate, totalMinutes) {
    const d = new Date(baseDate.getTime());
    if (totalMinutes < 0 || totalMinutes >= 1440) {
      const dayShift = Math.floor(totalMinutes / 1440);
      d.setUTCDate(d.getUTCDate() + dayShift);
    }
    const wrapped = (totalMinutes % 1440 + 1440) % 1440;
    const hour = Math.floor(wrapped / 60);
    const minute = wrapped % 60;
    const datePart = `${d.getUTCFullYear()}${(d.getUTCMonth() + 1).toString().padStart(2, "0")}${d.getUTCDate().toString().padStart(2, "0")}`;
    const timePart = `${hour.toString().padStart(2, "0")}${minute.toString().padStart(2, "0")}00`;
    return { datePart, timePart };
  }
  function generateIcs(scheduleData, options) {
    const strings = uiStrings[options.lang];
    const dayMap = {
      "1": "SU",
      "2": "MO",
      "3": "TU",
      "4": "WE",
      "5": "TH",
      "6": "FR",
      "7": "SA"
    };
    const icsEvents = [];
    scheduleData.forEach((course) => {
      const sanitizedCode = course.courseCode.replace(/\s+/g, "-");
      const emoji = options.courseEmojis[sanitizedCode] ?? "\u{1F4DA}";
      course.schedule.forEach((entry) => {
        if (!entry.startTime || !entry.endTime) return;
        const { start: startTotalMins, end: endTotalMins } = getAdjustedTimesInMinutes(
          entry.startTime,
          entry.endTime,
          options.ramadanMode
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
          const activityTypeEmoji = course.activity === "\u0645\u062D\u0627\u0636\u0631\u0629" ? "\u{1F4D6}" : course.activity === "\u062A\u0645\u0627\u0631\u064A\u0646" ? "\u{1F3AF}" : "";
          icsEvents.push(
            [
              "BEGIN:VEVENT",
              `DTSTAMP:${toIcsDate(/* @__PURE__ */ new Date())}`,
              `UID:${sanitizedCode}-${entry.days.join("")}-${Date.now()}${Math.random()}`,
              `DTSTART;TZID=Asia/Riyadh:${startParts.datePart}T${startParts.timePart}`,
              `DTEND;TZID=Asia/Riyadh:${endParts.datePart}T${endParts.timePart}`,
              `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(options.semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
              `SUMMARY:${`${course.courseCode} ${emoji}${activityTypeEmoji}`.trim()}`,
              `LOCATION:${entry.room}`,
              `DESCRIPTION:${course.courseName}\\nSection: ${course.sectionNumber}\\nInstructor: ${course.instructor}`,
              "END:VEVENT"
            ].join("\n")
          );
        });
      });
    });
    if (options.drivingTimeTo > 0 || options.drivingTimeFrom > 0) {
      const dailyBounds = {};
      scheduleData.forEach((course) => {
        course.schedule.forEach((entry) => {
          const { start, end } = getAdjustedTimesInMinutes(
            entry.startTime,
            entry.endTime,
            options.ramadanMode
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
        const createDrivingEvent = (title, baseTimeMinutes, offsetMinutes, isDrivingTo) => {
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
          const formatDate = (d) => `${d.getUTCFullYear()}${(d.getUTCMonth() + 1).toString().padStart(2, "0")}${d.getUTCDate().toString().padStart(2, "0")}`;
          const formatTime = (d) => `${d.getUTCHours().toString().padStart(2, "0")}${d.getUTCMinutes().toString().padStart(2, "0")}00`;
          icsEvents.push(
            [
              "BEGIN:VEVENT",
              `DTSTAMP:${toIcsDate(/* @__PURE__ */ new Date())}`,
              `UID:DRIVING-${dayIndex}-${isDrivingTo ? "TO" : "FROM"}-${Date.now()}`,
              `DTSTART;TZID=Asia/Riyadh:${formatDate(startTime)}T${formatTime(startTime)}`,
              `DTEND;TZID=Asia/Riyadh:${formatDate(endTime)}T${formatTime(endTime)}`,
              `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(options.semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
              `SUMMARY:${options.drivingEmoji} ${title}`,
              "TRANSP:TRANSPARENT",
              "END:VEVENT"
            ].join("\n")
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
      "END:VCALENDAR"
    ].join("\n");
  }
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // src/core/parse.ts
  function parseScheduleFromDocument(doc) {
    const scheduleTable = doc.getElementById("myForm:studScheduleTable");
    if (!scheduleTable) return null;
    const scheduleData = [];
    const rows = scheduleTable.querySelectorAll("tbody > tr");
    rows.forEach((row) => {
      const cells = row.children;
      if (cells.length < 7) return;
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
      }).filter((entry) => entry.days.length > 0);
      scheduleData.push({
        courseCode,
        courseName,
        activity,
        sectionNumber,
        instructor,
        schedule: scheduleEntries
      });
    });
    const studentName = doc.getElementById("studNameText")?.textContent?.trim() || "Student";
    return { scheduleData, studentName };
  }

  // src/tm/assets/generated.ts
  var CONTROLS_HTML = `<div class="sm-field sm-col">
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
  <div class="sm-row">
    <input type="text" id="drivingEmoji" class="save-state sm-input sm-emoji" value="\u{1F697}" />
    <select id="drivingColorId" class="save-state sm-input sm-color-select">
      <option value="1">Lavender</option>
      <option value="2">Sage</option>
      <option value="3">Grape</option>
      <option value="4">Flamingo</option>
      <option value="5">Banana</option>
      <option value="6">Tangerine</option>
      <option value="7">Peacock</option>
      <option value="8">Graphite</option>
      <option value="9">Blueberry</option>
      <option value="10">Basil</option>
      <option value="11">Tomato</option>
    </select>
  </div>
</div>
<div class="sm-field sm-col">
  <label id="labelRamadanMode" for="ramadanMode">Ramadan Schedule</label>
  <select id="ramadanMode" class="save-state sm-input">
    <option id="ramadanModeOptionOff" value="off">No Ramadan Schedule</option>
    <option id="ramadanModeOptionEngineering" value="engineering">Engineering</option>
    <option id="ramadanModeOptionFirstYear" value="firstYear">1st Year</option>
  </select>
</div>`;
  var USERSCRIPT_CSS = `#custom-controls-container {
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

#custom-controls-container .sm-color-select {
  min-width: 96px;
  font-size: 11px;
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

  // src/tm/main.ts
  var PREFS_KEY = "schedulePrefs";
  var currentLanguage = "ar";
  var stylesInjected = false;
  var byId = (id) => document.getElementById(id);
  var byIdRequired = (id) => {
    const el = byId(id);
    if (!el) throw new Error(`Required element not found: ${id}`);
    return el;
  };
  function injectStyles() {
    if (stylesInjected) return;
    const styleEl = document.createElement("style");
    styleEl.id = "schmaker-userscript-styles";
    styleEl.textContent = USERSCRIPT_CSS;
    document.head.appendChild(styleEl);
    stylesInjected = true;
  }
  function saveState() {
    const courseEmojis = {};
    const courseColors = {};
    document.querySelectorAll('input[id^="emoji-input-"]').forEach((input) => {
      const key = input.id.replace("emoji-input-", "");
      courseEmojis[key] = input.value;
    });
    document.querySelectorAll('select[id^="color-input-"]').forEach((select) => {
      const key = select.id.replace("color-input-", "");
      courseColors[key] = select.value;
    });
    const prefs = {
      lang: currentLanguage,
      values: {},
      courseEmojis,
      courseColors,
      drivingColorId: byId("drivingColorId")?.value ?? ""
    };
    document.querySelectorAll(".save-state").forEach((el) => {
      prefs.values[el.id] = el.value;
    });
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }
  function updateUIText() {
    const strings = uiStrings[currentLanguage];
    const isArabic = currentLanguage === "ar";
    byIdRequired("custom-controls-container").style.direction = isArabic ? "rtl" : "ltr";
    byIdRequired("labelSemesterStart").textContent = strings.semesterStart;
    byIdRequired("labelSemesterEnd").textContent = strings.semesterEnd;
    byIdRequired("labelDrivingTimeTo").textContent = strings.drivingTimeTo;
    byIdRequired("labelDrivingTimeFrom").textContent = strings.drivingTimeFrom;
    byIdRequired("labelDrivingEmoji").textContent = strings.drivingEmoji;
    byIdRequired("labelRamadanMode").textContent = strings.ramadanSchedule;
    byIdRequired("ramadanModeOptionOff").textContent = strings.ramadanOff;
    byIdRequired("ramadanModeOptionEngineering").textContent = strings.ramadanEngineering;
    byIdRequired("ramadanModeOptionFirstYear").textContent = strings.ramadanFirstYear;
    byIdRequired("drivingTimeToHours").placeholder = strings.hoursPlaceholder;
    byIdRequired("drivingTimeToMinutes").placeholder = strings.minutesPlaceholder;
    byIdRequired("drivingTimeFromHours").placeholder = strings.hoursPlaceholder;
    byIdRequired("drivingTimeFromMinutes").placeholder = strings.minutesPlaceholder;
    const dl = document.querySelector("#downloadIcsBtn span");
    const gd = document.querySelector("#showGuideBtn span");
    const lg = document.querySelector("#toggleLangBtn span");
    const rs = document.querySelector("#resetBtn span");
    if (dl) dl.textContent = strings.downloadIcs;
    if (gd) gd.textContent = strings.guide;
    if (lg) lg.textContent = strings.language;
    if (rs) rs.textContent = strings.reset;
  }
  function loadState() {
    const savedPrefs = localStorage.getItem(PREFS_KEY);
    if (!savedPrefs) {
      updateUIText();
      return;
    }
    const parsed = JSON.parse(savedPrefs);
    currentLanguage = parsed.lang === "en" ? "en" : "ar";
    if (parsed.values) {
      Object.keys(parsed.values).forEach((id) => {
        const el = byId(id);
        if (el) el.value = parsed.values?.[id] ?? "";
      });
    }
    if (parsed.courseEmojis) {
      Object.keys(parsed.courseEmojis).forEach((sanitizedCode) => {
        const input = byId(`emoji-input-${sanitizedCode}`);
        if (input) input.value = parsed.courseEmojis?.[sanitizedCode] ?? input.value;
      });
    }
    if (parsed.courseColors) {
      Object.keys(parsed.courseColors).forEach((sanitizedCode) => {
        const select = byId(`color-input-${sanitizedCode}`);
        if (select) select.value = parsed.courseColors?.[sanitizedCode] ?? select.value;
      });
    }
    if (typeof parsed.drivingColorId === "string") {
      const drivingColor = byId("drivingColorId");
      if (drivingColor) drivingColor.value = parsed.drivingColorId;
    }
    updateUIText();
  }
  function resetState(event) {
    event.preventDefault();
    if (confirm(
      currentLanguage === "ar" ? "\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646\u0643 \u062A\u0631\u064A\u062F \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A\u061F" : "Are you sure you want to reset all settings?"
    )) {
      localStorage.removeItem(PREFS_KEY);
      location.reload();
    }
  }
  function toggleLanguage(event) {
    event.preventDefault();
    currentLanguage = currentLanguage === "ar" ? "en" : "ar";
    updateUIText();
    saveState();
  }
  function showGuide(event) {
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
      strings.guideStep5
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
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) document.body.removeChild(modalOverlay);
    };
    closeBtn.onclick = () => {
      document.body.removeChild(modalOverlay);
    };
  }
  function injectEmojiInputs() {
    const scheduleTable = byId("myForm:studScheduleTable");
    if (!scheduleTable) return;
    const preferredClassEmojis = [
      "\u{1F4DA}",
      "\u{1F5A5}\uFE0F",
      "\u{1F30D}",
      "\u{1F9EA}",
      "\u{1F4D0}",
      "\u{1F4C8}",
      "\u{1F9E0}",
      "\u{1F4BB}",
      "\u{1F4DD}",
      "\u{1F9EC}",
      "\u2699\uFE0F",
      "\u{1F3DB}\uFE0F",
      "\u{1F52C}",
      "\u{1F5E3}\uFE0F",
      "\u{1F4CA}",
      "\u{1F9EE}",
      "\u269B\uFE0F",
      "\u{1F4D6}",
      "\u{1F6F0}\uFE0F"
    ];
    for (let i = preferredClassEmojis.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [preferredClassEmojis[i], preferredClassEmojis[j]] = [preferredClassEmojis[j], preferredClassEmojis[i]];
    }
    let emojiIndex = 0;
    const colorIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
    for (let i = colorIds.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorIds[i], colorIds[j]] = [colorIds[j], colorIds[i]];
    }
    let colorIndex = 0;
    const processedCourses = /* @__PURE__ */ new Set();
    scheduleTable.querySelectorAll("tbody > tr").forEach((row) => {
      const courseCodeCell = row.querySelector('td[data-th="\u0631\u0645\u0632 \u0627\u0644\u0645\u0642\u0631\u0631"]');
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
      input.value = preferredClassEmojis[emojiIndex % preferredClassEmojis.length];
      emojiIndex += 1;
      const centerTag = courseCodeCell.querySelector("center");
      const colorSelect = document.createElement("select");
      colorSelect.id = `color-input-${sanitizedCode}`;
      colorSelect.style.margin = "0 6px";
      colorSelect.style.border = "1px solid #ccc";
      colorSelect.style.borderRadius = "4px";
      colorSelect.style.height = "24px";
      colorSelect.style.fontSize = "11px";
      [
        { value: "1", label: "Lavender" },
        { value: "2", label: "Sage" },
        { value: "3", label: "Grape" },
        { value: "4", label: "Flamingo" },
        { value: "5", label: "Banana" },
        { value: "6", label: "Tangerine" },
        { value: "7", label: "Peacock" },
        { value: "8", label: "Graphite" },
        { value: "9", label: "Blueberry" },
        { value: "10", label: "Basil" },
        { value: "11", label: "Tomato" }
      ].forEach((optionDef) => {
        const option = document.createElement("option");
        option.value = optionDef.value;
        option.textContent = optionDef.label;
        colorSelect.appendChild(option);
      });
      colorSelect.value = colorIds[colorIndex % colorIds.length] ?? "1";
      colorIndex += 1;
      const container = centerTag ?? courseCodeCell;
      container.appendChild(input);
      container.appendChild(colorSelect);
    });
  }
  function addSaveListeners() {
    document.querySelectorAll('.save-state, input[id^="emoji-input-"], select[id^="color-input-"]').forEach((element) => {
      element.addEventListener("change", saveState);
    });
  }
  function parseAndDownloadIcs(event) {
    event.preventDefault();
    const strings = uiStrings[currentLanguage];
    const startDateStr = byIdRequired("semesterStart").value;
    const endDateStr = byIdRequired("semesterEnd").value;
    if (!startDateStr || !endDateStr) {
      alert(strings.alertDates);
      return;
    }
    const parsed = parseScheduleFromDocument(document);
    if (!parsed) {
      alert(strings.alertTable);
      return;
    }
    const hTo = parseInt(byIdRequired("drivingTimeToHours").value, 10) || 0;
    const mTo = parseInt(byIdRequired("drivingTimeToMinutes").value, 10) || 0;
    const hFrom = parseInt(byIdRequired("drivingTimeFromHours").value, 10) || 0;
    const mFrom = parseInt(byIdRequired("drivingTimeFromMinutes").value, 10) || 0;
    const drivingEmoji = byIdRequired("drivingEmoji").value || "\u{1F697}";
    const ramadanRaw = byId("ramadanMode")?.value;
    const ramadanMode = ramadanRaw === "engineering" || ramadanRaw === "firstYear" || ramadanRaw === "off" ? ramadanRaw : ramadanRaw === "on" ? "engineering" : "off";
    const courseEmojis = {};
    document.querySelectorAll('input[id^="emoji-input-"]').forEach((input) => {
      const key = input.id.replace("emoji-input-", "");
      courseEmojis[key] = input.value;
    });
    const icsString = generateIcs(parsed.scheduleData, {
      semesterStart: /* @__PURE__ */ new Date(`${startDateStr}T00:00:00Z`),
      semesterEnd: /* @__PURE__ */ new Date(`${endDateStr}T23:59:59Z`),
      drivingTimeTo: hTo * 60 + mTo,
      drivingTimeFrom: hFrom * 60 + mFrom,
      drivingEmoji,
      ramadanMode,
      lang: currentLanguage,
      courseEmojis
    });
    downloadFile(
      `schedule_${parsed.studentName.replace(/\s/g, "_")}.ics`,
      icsString,
      "text/calendar"
    );
  }
  function initializeScript() {
    if (document.getElementById("custom-controls-container")) return;
    const printButtonContainer = document.querySelector(
      "a[id='myForm:printLink']"
    );
    if (!printButtonContainer) return;
    injectStyles();
    const controlsContainer = document.createElement("div");
    controlsContainer.id = "custom-controls-container";
    controlsContainer.innerHTML = CONTROLS_HTML;
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
    buttonWrapper.appendChild(createButton("downloadIcsBtn", parseAndDownloadIcs));
    buttonWrapper.appendChild(createButton("showGuideBtn", showGuide));
    buttonWrapper.appendChild(createButton("toggleLangBtn", toggleLanguage));
    buttonWrapper.appendChild(createButton("resetBtn", resetState));
    controlsContainer.appendChild(buttonWrapper);
    const semesterSelector = byId("myForm:selectSemester");
    if (!semesterSelector?.parentElement?.parentElement) return;
    semesterSelector.parentElement.parentElement.insertAdjacentElement(
      "afterend",
      controlsContainer
    );
    injectEmojiInputs();
    const drivingColorSelect = byId("drivingColorId");
    if (drivingColorSelect) {
      const choices = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
      drivingColorSelect.value = choices[Math.floor(Math.random() * choices.length)] ?? "1";
    }
    loadState();
    addSaveListeners();
    updateUIText();
  }
  var observer = new MutationObserver(() => {
    const printLinkExists = document.querySelector("a[id='myForm:printLink']");
    const myControlsExist = document.getElementById("custom-controls-container");
    if (printLinkExists && !myControlsExist) {
      initializeScript();
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  initializeScript();
})();
