namespace SchMakerApp {
  export function initializeScript(): void {
    const printButtonContainer = document.querySelector<HTMLAnchorElement>(
      "a#myForm\\:printLink",
    );
    if (!printButtonContainer) {
      console.log("Script anchor not found, exiting.");
      return;
    }

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
    if (!semesterSelector?.parentElement?.parentElement) {
      console.log("Semester selector not found, exiting.");
      return;
    }

    semesterSelector.parentElement.parentElement.insertAdjacentElement(
      "afterend",
      controlsContainer,
    );

    injectEmojiInputs();
    loadState();
    addSaveListeners();
  }

  export function updateUIText(): void {
    const strings = uiStrings[currentLanguage];
    const isArabic = currentLanguage === "ar";

    byIdRequired<HTMLElement>("custom-controls-container").style.direction =
      isArabic ? "rtl" : "ltr";
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

  export function toggleLanguage(event: MouseEvent): void {
    event.preventDefault();
    currentLanguage = currentLanguage === "ar" ? "en" : "ar";
    updateUIText();
    saveState();
  }

  export function showGuide(event: MouseEvent): void {
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

    modalOverlay.onclick = (e: MouseEvent) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
      }
    };

    const closeBtn = byId<HTMLButtonElement>("guideCloseBtn");
    if (closeBtn) {
      closeBtn.onclick = () => {
        document.body.removeChild(modalOverlay);
      };
    }
  }

  export function injectEmojiInputs(): void {
    const scheduleTable = byId<HTMLElement>("myForm:studScheduleTable");
    if (!scheduleTable) return;

    const defaultEmojis = ["📚", "💻", "🧪", "📈", "🧠", "💡", "✍️", "🗣️", "🌍", "🕌", "🔢", "⚛️", "📜", "⚖️", "🎨"];
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
      input.id = `emoji-input-${courseCode.replace(/\s+/g, "-")}`;
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

  export function addSaveListeners(): void {
    document
      .querySelectorAll<HTMLElement>('.save-state, input[id^="emoji-input-"]')
      .forEach((element) => {
        element.addEventListener("change", saveState);
      });
  }
}
