import type { Settings, Theme, UiLang } from "./types";

const KEY = "soz.settings.v1";

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function defaultSettings(): Settings {
  return {
    uiLang: "tr",
    translationId: "tr-ytc",
    bookId: "GEN",
    chapter: 1,
    theme: (prefersDark() ? "dark" : "light") as Theme,
    fontSize: 19,
    layout: "paragraph",
    redLetters: true,
    sidebarOpen: window.innerWidth >= 980,
  };
}

const themes: Theme[] = ["light", "sepia", "dark"];

export function loadSettings(): Settings {
  const base = defaultSettings();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Settings>;
    const merged: Settings = { ...base, ...saved };
    if (!themes.includes(merged.theme)) merged.theme = base.theme;
    if (merged.uiLang !== "tr" && merged.uiLang !== "en") merged.uiLang = base.uiLang;
    if (merged.layout !== "paragraph" && merged.layout !== "verse") merged.layout = base.layout;
    merged.fontSize = Math.min(30, Math.max(15, Number(merged.fontSize) || base.fontSize));
    merged.chapter = Math.max(1, Number(merged.chapter) || 1);
    return merged;
  } catch {
    return base;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private mode, quota); the app still works.
  }
}

export function isUiLang(value: string): value is UiLang {
  return value === "tr" || value === "en";
}
