import type { Layout, Theme, UiLang } from "./types";

export interface Dict {
  appName: string;
  appSubtitle: string;
  oldTestament: string;
  newTestament: string;
  chapter: string;
  chapterShort: string;
  chaptersCount: (n: number) => string;
  previousChapter: string;
  nextChapter: string;
  settings: string;
  appearance: string;
  theme: string;
  themeLight: string;
  themeSepia: string;
  themeDark: string;
  textSize: string;
  layout: string;
  layoutParagraph: string;
  layoutVerse: string;
  redLetters: string;
  redLettersHint: string;
  language: string;
  translation: string;
  about: string;
  license: string;
  source: string;
  close: string;
  chooseChapter: string;
  loading: string;
  loadError: string;
  retry: string;
  bookList: string;
  menu: string;
  jumpTo: string;
  verseCount: (n: number) => string;
  shortcutHint: string;
  fontSizeSmaller: string;
  fontSizeLarger: string;
  translationLanguage: (lang: string) => string;
}

const tr: Dict = {
  appName: "Söz",
  appSubtitle: "Kutsal Kitap",
  oldTestament: "Eski Antlaşma",
  newTestament: "Yeni Antlaşma",
  chapter: "Bölüm",
  chapterShort: "Böl.",
  chaptersCount: (n) => `${n} bölüm`,
  previousChapter: "Önceki bölüm",
  nextChapter: "Sonraki bölüm",
  settings: "Ayarlar",
  appearance: "Görünüm",
  theme: "Tema",
  themeLight: "Açık",
  themeSepia: "Sepya",
  themeDark: "Koyu",
  textSize: "Yazı boyutu",
  layout: "Düzen",
  layoutParagraph: "Paragraf",
  layoutVerse: "Ayet ayet",
  redLetters: "İsa'nın sözleri kırmızı",
  redLettersHint: "Yalnızca kırmızı harf desteği olan çevirilerde görünür.",
  language: "Arayüz dili",
  translation: "Çeviri",
  about: "Hakkında",
  license: "Lisans",
  source: "Kaynak",
  close: "Kapat",
  chooseChapter: "Bölüm seç",
  loading: "Metin yükleniyor…",
  loadError: "Metin yüklenemedi.",
  retry: "Yeniden dene",
  bookList: "Kitap listesi",
  menu: "Menü",
  jumpTo: "Git",
  verseCount: (n) => `${n} ayet`,
  shortcutHint: "← → bölüm · B kenar çubuğu · T tema",
  fontSizeSmaller: "Yazıyı küçült",
  fontSizeLarger: "Yazıyı büyüt",
  translationLanguage: (lang) => (lang === "tr" ? "Türkçe" : "İngilizce"),
};

const en: Dict = {
  appName: "Söz",
  appSubtitle: "Holy Bible",
  oldTestament: "Old Testament",
  newTestament: "New Testament",
  chapter: "Chapter",
  chapterShort: "Ch.",
  chaptersCount: (n) => `${n} chapter${n === 1 ? "" : "s"}`,
  previousChapter: "Previous chapter",
  nextChapter: "Next chapter",
  settings: "Settings",
  appearance: "Appearance",
  theme: "Theme",
  themeLight: "Light",
  themeSepia: "Sepia",
  themeDark: "Dark",
  textSize: "Text size",
  layout: "Layout",
  layoutParagraph: "Paragraph",
  layoutVerse: "Verse per line",
  redLetters: "Words of Jesus in red",
  redLettersHint: "Only shown for translations that mark the words of Jesus.",
  language: "Interface language",
  translation: "Translation",
  about: "About",
  license: "License",
  source: "Source",
  close: "Close",
  chooseChapter: "Choose a chapter",
  loading: "Loading text…",
  loadError: "Could not load the text.",
  retry: "Try again",
  bookList: "Books",
  menu: "Menu",
  jumpTo: "Go",
  verseCount: (n) => `${n} verses`,
  shortcutHint: "← → chapter · B sidebar · T theme",
  fontSizeSmaller: "Decrease text size",
  fontSizeLarger: "Increase text size",
  translationLanguage: (lang) => (lang === "tr" ? "Turkish" : "English"),
};

export const dictionaries: Record<UiLang, Dict> = { tr, en };

export function t(lang: UiLang): Dict {
  return dictionaries[lang];
}

export type ThemeLabelKey = "themeLight" | "themeSepia" | "themeDark";
export type LayoutLabelKey = "layoutParagraph" | "layoutVerse";

export const themeLabels: Record<Theme, ThemeLabelKey> = {
  light: "themeLight",
  sepia: "themeSepia",
  dark: "themeDark",
};

export const layoutLabels: Record<Layout, LayoutLabelKey> = {
  paragraph: "layoutParagraph",
  verse: "layoutVerse",
};
