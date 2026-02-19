namespace SchMakerApp {
  let stylesInjected = false;

  function injectStyles(): void {
    if (stylesInjected) return;
    const styleEl = document.createElement("style");
    styleEl.id = "schmaker-userscript-styles";
    styleEl.textContent = USERSCRIPT_CSS;
    document.head.appendChild(styleEl);
    stylesInjected = true;
  }

  export function initializeScript(): void {
    const printButtonContainer = document.querySelector<HTMLAnchorElement>(
      "a#myForm\\:printLink",
    );
    if (!printButtonContainer) {
      console.log("Script anchor not found, exiting.");
      return;
    }

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
