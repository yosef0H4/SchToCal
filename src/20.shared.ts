namespace SchMakerApp {
  export const PREFS_KEY = "psauSchedulePrefs";

  export const uiStrings: Record<Lang, UIStrings> = {
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

  export let currentLanguage: Lang = "ar";

  export const byId = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

  export const byIdRequired = <T extends HTMLElement>(id: string): T => {
    const el = byId<T>(id);
    if (!el) throw new Error(`Required element not found: ${id}`);
    return el;
  };
}
