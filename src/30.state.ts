namespace SchMakerApp {
  export function saveState(): void {
    const courseEmojis: Record<string, string> = {};
    document
      .querySelectorAll<HTMLInputElement>('input[id^="emoji-input-"]')
      .forEach((input) => {
        courseEmojis[input.id] = input.value;
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

  export function loadState(): void {
    const savedPrefs = localStorage.getItem(PREFS_KEY);
    if (savedPrefs) {
      const parsed = JSON.parse(savedPrefs) as Partial<Prefs>;
      currentLanguage = parsed.lang === "en" ? "en" : "ar";

      if (parsed.values) {
        Object.keys(parsed.values).forEach((id) => {
          const el = byId<HTMLInputElement | HTMLSelectElement>(id);
          if (el) {
            el.value = parsed.values?.[id] ?? "";
          }
        });
      }

      if (parsed.courseEmojis) {
        Object.keys(parsed.courseEmojis).forEach((inputId) => {
          const input = byId<HTMLInputElement>(inputId);
          if (input) {
            input.value = parsed.courseEmojis?.[inputId] ?? input.value;
          }
        });
      }
    }

    updateUIText();
  }

  export function resetState(event: MouseEvent): void {
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
}
