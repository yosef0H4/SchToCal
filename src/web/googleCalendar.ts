import {
  buildRecurringSeries,
  DAY_MAP,
  firstOccurrenceDate,
  minutesToTimeParts,
  toUntilStamp,
  type BuildSeriesOptions,
} from "../core/eventModel";
import { CourseSchedule } from "../core/types";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

const TAG_APP_KEY = "schmakerApp";
const TAG_APP_VALUE = "schmaker";
const TAG_SEMESTER_KEY = "schmakerSemester";
const TAG_VERSION_KEY = "schmakerVersion";
const TAG_VERSION_VALUE = "1";
const GOOGLE_EVENT_COLOR_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"] as const;

type GoogleColorId = (typeof GOOGLE_EVENT_COLOR_IDS)[number];

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback?: (error: { type?: string; message?: string }) => void;
      }) => GoogleTokenClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let gsiPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src=\"${GSI_SRC}\"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity script.")));
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity script."));
    document.head.appendChild(script);
  });

  return gsiPromise;
}

export async function requestAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("Google Identity SDK is unavailable.");

  return new Promise((resolve, reject) => {
    let settled = false;
    const settleResolve = (token: string): void => {
      if (settled) return;
      settled = true;
      resolve(token);
    };
    const settleReject = (message: string): void => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    };

    const timeout = window.setTimeout(() => {
      settleReject("Google sign-in was cancelled or timed out.");
    }, 120000);

    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: CALENDAR_SCOPE,
      callback: (response: GoogleTokenResponse) => {
        window.clearTimeout(timeout);
        if (response.error || !response.access_token) {
          settleReject(response.error_description || response.error || "Failed to get access token.");
          return;
        }
        settleResolve(response.access_token);
      },
      error_callback: (error) => {
        window.clearTimeout(timeout);
        const type = error?.type ?? "unknown_error";
        if (type === "popup_closed") {
          settleReject("Google sign-in popup was closed.");
          return;
        }
        settleReject(error?.message || `Google sign-in failed: ${type}`);
      },
    });

    client.requestAccessToken({ prompt: "consent" });
  });
}

async function fetchGoogle(
  accessToken: string,
  path: string,
  init: RequestInit = {},
  retries = 3,
): Promise<Response> {
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if ((response.status === 429 || response.status >= 500) && retries > 0) {
    const backoffMs = (4 - retries) * 500;
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    return fetchGoogle(accessToken, path, init, retries - 1);
  }

  return response;
}

async function fetchAllCalendarItems(accessToken: string, path: string): Promise<any[]> {
  const items: any[] = [];
  let pageToken = "";

  do {
    const sep = path.includes("?") ? "&" : "?";
    const url = pageToken ? `${path}${sep}pageToken=${encodeURIComponent(pageToken)}` : path;
    const response = await fetchGoogle(accessToken, url);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Calendar API error (${response.status}): ${body}`);
    }
    const data = await response.json();
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return items;
}

export async function ensureSemesterCalendar(
  accessToken: string,
  semesterLabel: string,
): Promise<{ id: string; summary: string }> {
  const calendars = await fetchAllCalendarItems(
    accessToken,
    `/users/me/calendarList?minAccessRole=owner&showHidden=false&maxResults=250`,
  );

  const existing = calendars.find((c) => c.summary === semesterLabel);
  if (existing?.id) return { id: existing.id, summary: existing.summary };

  const createResp = await fetchGoogle(accessToken, `/calendars`, {
    method: "POST",
    body: JSON.stringify({
      summary: semesterLabel,
      timeZone: "Asia/Riyadh",
    }),
  });

  if (!createResp.ok) {
    const body = await createResp.text();
    throw new Error(`Failed to create calendar (${createResp.status}): ${body}`);
  }

  const created = await createResp.json();
  return { id: created.id, summary: created.summary };
}

function toDateTimeString(date: Date, minutes: number): string {
  const [hour, minute] = minutesToTimeParts(minutes);
  const next = new Date(date.getTime());
  if (minutes < 0 || minutes >= 1440) {
    const dayShift = Math.floor(minutes / 1440);
    next.setUTCDate(next.getUTCDate() + dayShift);
  }

  const yyyy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

async function replaceTaggedEvents(accessToken: string, calendarId: string, semesterTag: string): Promise<number> {
  const query = `/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=false&showDeleted=false&privateExtendedProperty=${encodeURIComponent(`${TAG_APP_KEY}=${TAG_APP_VALUE}`)}&privateExtendedProperty=${encodeURIComponent(`${TAG_SEMESTER_KEY}=${semesterTag}`)}&maxResults=250`;
  const events = await fetchAllCalendarItems(accessToken, query);

  for (const event of events) {
    if (!event.id) continue;
    const delResp = await fetchGoogle(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event.id)}`,
      { method: "DELETE" },
    );

    if (!delResp.ok && delResp.status !== 404) {
      const body = await delResp.text();
      throw new Error(`Failed to delete event ${event.id} (${delResp.status}): ${body}`);
    }
  }

  return events.length;
}

export async function syncScheduleToGoogle(params: {
  accessToken: string;
  calendarId: string;
  scheduleData: CourseSchedule[];
  options: BuildSeriesOptions;
  colorOverrides?: {
    courseColors?: Record<string, string>;
    drivingColorId?: string;
  };
}): Promise<{ deleted: number; inserted: number }> {
  const semesterTag = `${params.options.semesterStart.toISOString().slice(0, 10)}_${params.options.semesterEnd.toISOString().slice(0, 10)}`;
  const deleted = await replaceTaggedEvents(params.accessToken, params.calendarId, semesterTag);

  const series = buildRecurringSeries(params.scheduleData, params.options);
  const colorByGroup = new Map<string, string>();
  const shuffledColorIds: GoogleColorId[] = [...GOOGLE_EVENT_COLOR_IDS];
  for (let i = shuffledColorIds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledColorIds[i], shuffledColorIds[j]] = [shuffledColorIds[j], shuffledColorIds[i]];
  }

  const usedColorIds = new Set<GoogleColorId>();
  const validColorId = (value?: string): GoogleColorId | undefined =>
    GOOGLE_EVENT_COLOR_IDS.find((id) => id === value);

  const drivingOverride = validColorId(params.colorOverrides?.drivingColorId);
  if (drivingOverride) {
    colorByGroup.set("driving", drivingOverride);
    usedColorIds.add(drivingOverride);
  }

  const overrideCourseColors = params.colorOverrides?.courseColors ?? {};
  Object.entries(overrideCourseColors).forEach(([courseCode, colorId]) => {
    const valid = validColorId(colorId);
    if (!valid) return;
    colorByGroup.set(courseCode, valid);
    usedColorIds.add(valid);
  });

  const availableColorIds = shuffledColorIds.filter((id) => !usedColorIds.has(id));
  let nextColorIndex = 0;
  const colorForGroup = (group?: string): GoogleColorId | undefined => {
    if (!group) return undefined;

    const existing = colorByGroup.get(group) as GoogleColorId | undefined;
    if (existing) return existing;

    if (nextColorIndex >= availableColorIds.length) return undefined;
    const assigned = availableColorIds[nextColorIndex];
    nextColorIndex += 1;
    colorByGroup.set(group, assigned);
    return assigned;
  };

  let inserted = 0;

  for (const s of series) {
    const firstDate = firstOccurrenceDate(params.options.semesterStart, s.dayIndex);
    const colorId = colorForGroup(s.colorGroup);
    const payload = {
      summary: s.summary,
      location: s.location ?? "",
      description: s.description ?? "",
      start: {
        dateTime: toDateTimeString(firstDate, s.startMinutes),
        timeZone: "Asia/Riyadh",
      },
      end: {
        dateTime: toDateTimeString(firstDate, s.endMinutes),
        timeZone: "Asia/Riyadh",
      },
      recurrence: [
        `RRULE:FREQ=WEEKLY;UNTIL=${toUntilStamp(params.options.semesterEnd)};BYDAY=${DAY_MAP[s.dayIndex]}`,
      ],
      transparency: s.transparency ?? "opaque",
      ...(colorId ? { colorId } : {}),
      extendedProperties: {
        private: {
          [TAG_APP_KEY]: TAG_APP_VALUE,
          [TAG_SEMESTER_KEY]: semesterTag,
          [TAG_VERSION_KEY]: TAG_VERSION_VALUE,
        },
      },
    };

    const insertResp = await fetchGoogle(
      params.accessToken,
      `/calendars/${encodeURIComponent(params.calendarId)}/events`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (!insertResp.ok) {
      const body = await insertResp.text();
      throw new Error(`Failed to insert event (${insertResp.status}): ${body}`);
    }

    inserted += 1;
  }

  return { deleted, inserted };
}
