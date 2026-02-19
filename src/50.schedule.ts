namespace SchMakerApp {
  export function parseSchedule(): CourseSchedule[] | null {
    const scheduleTable = byId<HTMLElement>("myForm:studScheduleTable");
    if (!scheduleTable) return null;

    const scheduleData: CourseSchedule[] = [];
    scheduleTable.querySelectorAll<HTMLTableRowElement>("tbody > tr").forEach((row) => {
      const cells = row.children;
      if (cells.length < 7) return;

      const courseCode = cells[0]?.textContent?.trim().split("\n")[0] ?? "";
      const courseName = cells[1]?.textContent?.trim() ?? "";
      const activity = cells[2]?.textContent?.trim() ?? "";
      const sectionNumber = cells[3]?.textContent?.trim() ?? "";
      const instructor = row.querySelector<HTMLInputElement>('input[id*=":instructor"]')?.value ?? "N/A";
      const rawSectionValue = row.querySelector<HTMLInputElement>('input[id*=":section"]')?.value ?? "";

      const scheduleEntries: ScheduleEntry[] = rawSectionValue.split("@n").map((entry) => {
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

  export function parseAndDownloadIcs(event: MouseEvent): void {
    event.preventDefault();

    const strings = uiStrings[currentLanguage];
    const startDateStr = byIdRequired<HTMLInputElement>("semesterStart").value;
    const endDateStr = byIdRequired<HTMLInputElement>("semesterEnd").value;

    if (!startDateStr || !endDateStr) {
      alert(strings.alertDates);
      return;
    }

    const scheduleData = parseSchedule();
    if (!scheduleData) {
      alert(strings.alertTable);
      return;
    }

    const hTo = parseInt(byIdRequired<HTMLInputElement>("drivingTimeToHours").value, 10) || 0;
    const mTo = parseInt(byIdRequired<HTMLInputElement>("drivingTimeToMinutes").value, 10) || 0;
    const hFrom = parseInt(byIdRequired<HTMLInputElement>("drivingTimeFromHours").value, 10) || 0;
    const mFrom = parseInt(byIdRequired<HTMLInputElement>("drivingTimeFromMinutes").value, 10) || 0;

    const semesterStart = new Date(`${startDateStr}T00:00:00Z`);
    const semesterEnd = new Date(`${endDateStr}T23:59:59Z`);
    const studentName = byIdRequired<HTMLElement>("studNameText").innerText.trim();
    const drivingEmoji = byIdRequired<HTMLInputElement>("drivingEmoji").value || "🚗";

    const icsString = generateIcs(
      scheduleData,
      semesterStart,
      semesterEnd,
      hTo * 60 + mTo,
      hFrom * 60 + mFrom,
      drivingEmoji,
    );

    downloadFile(`schedule_${studentName.replace(/\s/g, "_")}.ics`, icsString, "text/calendar");
  }

  export function generateIcs(
    scheduleData: CourseSchedule[],
    semesterStart: Date,
    semesterEnd: Date,
    drivingTimeTo: number,
    drivingTimeFrom: number,
    drivingEmoji: string,
  ): string {
    const strings = uiStrings[currentLanguage];
    const toIcsDate = (date: Date): string => `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

    const dayMap: Record<string, string> = {
      "1": "SU",
      "2": "MO",
      "3": "TU",
      "4": "WE",
      "5": "TH",
      "6": "FR",
      "7": "SA",
    };

    const convertTo24Hour = (h: number, m: number, period: string): [number, number] => {
      let hour = h;
      if (period.includes("م") && h !== 12) hour += 12;
      if (period.includes("ص") && h === 12) hour = 0;
      return [hour, m];
    };

    const getAdjustedTimes = (startStr: string, endStr: string): { start: number; end: number } => {
      const isRamadan = byId<HTMLSelectElement>("ramadanMode")?.value === "on";
      const sMatches = startStr.match(/\d+/g);
      const eMatches = endStr.match(/\d+/g);
      if (!sMatches || !eMatches || sMatches.length < 2 || eMatches.length < 2) return { start: 0, end: 0 };

      const [sH, sM] = sMatches.map(Number);
      const [eH, eM] = eMatches.map(Number);
      const [sHour, sMin] = convertTo24Hour(sH, sM, startStr);
      const [eHour, eMin] = convertTo24Hour(eH, eM, endStr);

      let startTotal = sHour * 60 + sMin;
      let endTotal = eHour * 60 + eMin;

      if (isRamadan) {
        const standardToSlot: Record<number, number> = { 8: 1, 9: 2, 10: 3, 11: 4, 13: 5, 14: 6, 15: 7, 16: 8 };
        const slot = standardToSlot[sHour];
        if (slot) {
          const ramadanStartMins = slot <= 3 ? 10 * 60 + (slot - 1) * 40 : 750 + (slot - 4) * 40;
          startTotal = ramadanStartMins;
          endTotal = ramadanStartMins + 35;
        }
      }

      return { start: startTotal, end: endTotal };
    };

    const icsEvents: string[] = [];

    scheduleData.forEach((course) => {
      const sanitizedCode = course.courseCode.replace(/\s+/g, "-");
      const emoji = byId<HTMLInputElement>(`emoji-input-${sanitizedCode}`)?.value ?? "📚";

      course.schedule.forEach((entry) => {
        if (!entry.startTime || !entry.endTime) return;

        const { start: startTotalMins, end: endTotalMins } = getAdjustedTimes(entry.startTime, entry.endTime);
        const startHour = Math.floor(startTotalMins / 60);
        const startMinute = startTotalMins % 60;
        const endHour = Math.floor(endTotalMins / 60);
        const endMinute = endTotalMins % 60;

        entry.days.forEach((dayIndex) => {
          if (!dayMap[dayIndex]) return;

          const dayOfWeek = parseInt(dayIndex, 10) - 1;
          const firstEventDate = new Date(semesterStart.getTime());
          while (firstEventDate.getUTCDay() !== dayOfWeek) {
            firstEventDate.setUTCDate(firstEventDate.getUTCDate() + 1);
          }

          const datePart = `${firstEventDate.getUTCFullYear()}${(firstEventDate.getUTCMonth() + 1).toString().padStart(2, "0")}${firstEventDate.getUTCDate().toString().padStart(2, "0")}`;
          const startTimePart = `${startHour.toString().padStart(2, "0")}${startMinute.toString().padStart(2, "0")}00`;
          const endTimePart = `${endHour.toString().padStart(2, "0")}${endMinute.toString().padStart(2, "0")}00`;
          const activityTypeEmoji = course.activity === "محاضرة" ? "📖" : course.activity === "تمارين" ? "🎯" : "";

          icsEvents.push(
            [
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
            ].join("\n"),
          );
        });
      });
    });

    if (drivingTimeTo > 0 || drivingTimeFrom > 0) {
      const dailyBounds: Record<string, { start: number; end: number }> = {};

      scheduleData.forEach((course) => {
        course.schedule.forEach((entry) => {
          const { start, end } = getAdjustedTimes(entry.startTime, entry.endTime);
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
        const firstEventDate = new Date(semesterStart.getTime());
        while (firstEventDate.getUTCDay() !== dayOfWeek) {
          firstEventDate.setUTCDate(firstEventDate.getUTCDate() + 1);
        }

        const createDrivingEvent = (title: string, baseTimeMinutes: number, offsetMinutes: number, isDrivingTo: boolean): void => {
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

          const formatDate = (d: Date): string => `${d.getUTCFullYear()}${(d.getUTCMonth() + 1).toString().padStart(2, "0")}${d.getUTCDate().toString().padStart(2, "0")}`;
          const formatTime = (d: Date): string => `${d.getUTCHours().toString().padStart(2, "0")}${d.getUTCMinutes().toString().padStart(2, "0")}00`;

          icsEvents.push(
            [
              "BEGIN:VEVENT",
              `DTSTAMP:${toIcsDate(new Date())}`,
              `UID:DRIVING-${dayIndex}-${isDrivingTo ? "TO" : "FROM"}-${Date.now()}`,
              `DTSTART;TZID=Asia/Riyadh:${formatDate(startTime)}T${formatTime(startTime)}`,
              `DTEND;TZID=Asia/Riyadh:${formatDate(endTime)}T${formatTime(endTime)}`,
              `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(semesterEnd)};BYDAY=${dayMap[dayIndex]}`,
              `SUMMARY:${drivingEmoji} ${title}`,
              "TRANSP:TRANSPARENT",
              "END:VEVENT",
            ].join("\n"),
          );
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

  export function downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
