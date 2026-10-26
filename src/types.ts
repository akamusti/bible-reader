export type Testament = "OT" | "NT";
export type Theme = "light" | "sepia" | "dark";
export type Layout = "paragraph" | "verse";
export type UiLang = "tr" | "en";

export interface BookIndex {
  id: string;
  testament: Testament;
  tr: string;
  en: string;
  trAbbr: string;
  enAbbr: string;
  chapters: number;
}

export interface TranslationMeta {
  id: string;
  name: string;
  abbrev: string;
  lang: UiLang;
  langName: string;
  file: string;
  license: string;
  licenseUrl: string;
  copyright: string;
  source: string;
  verses: number;
  bookCount: number;
}

export interface Manifest {
  generated: string;
  books: BookIndex[];
  translations: TranslationMeta[];
}

export type Block =
  | { t: "v"; n: string; text: string; p: number; q: number }
  | { t: "h"; text: string; lvl: number }
  | { t: "d"; text: string };

export interface Chapter {
  n: number;
  blocks: Block[];
  notes: { v: string; k: string; text: string }[];
}

export interface Book {
  id: string;
  name: string;
  abbrev: string;
  chapters: Chapter[];
}

export interface Translation extends TranslationMeta {
  books: Book[];
}

export interface Settings {
  uiLang: UiLang;
  translationId: string;
  bookId: string;
  chapter: number;
  theme: Theme;
  fontSize: number;
  layout: Layout;
  redLetters: boolean;
  sidebarOpen: boolean;
}
