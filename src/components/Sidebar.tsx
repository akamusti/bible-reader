import { useEffect, useState } from "react";
import type { BookIndex, Manifest, Testament, UiLang } from "../types";
import { t } from "../i18n";
import { CloseIcon } from "./Icons";

interface Props {
  open: boolean;
  manifest: Manifest;
  uiLang: UiLang;
  translationId: string;
  bookId: string;
  onTranslation: (id: string) => void;
  onBook: (id: string) => void;
  onClose: () => void;
}

export function Sidebar({
  open,
  manifest,
  uiLang,
  translationId,
  bookId,
  onTranslation,
  onBook,
  onClose,
}: Props) {
  const d = t(uiLang);
  const selected = manifest.books.find((b) => b.id === bookId);
  const [tab, setTab] = useState<Testament>(selected?.testament ?? "OT");

  useEffect(() => {
    if (selected) setTab(selected.testament);
  }, [selected]);

  const books = manifest.books.filter((b) => b.testament === tab);
  const bookName = (b: BookIndex) => (uiLang === "tr" ? b.tr : b.en);

  return (
    <aside className={`sidebar${open ? " is-open" : ""}`} aria-label={d.bookList}>
      <div className="sidebar-head">
        <div className="brand">
          <span className="brand-mark">Söz</span>
          <span className="brand-sub">{d.appSubtitle}</span>
        </div>
        <button className="icon-btn sidebar-close" onClick={onClose} aria-label={d.close} title={d.close}>
          <CloseIcon />
        </button>
      </div>

      <div className="translation-block">
        <span className="field-label">{d.translation}</span>
        <div className="translation-list">
          {manifest.translations.map((meta) => (
            <button
              key={meta.id}
              className={`translation-card${meta.id === translationId ? " is-active" : ""}`}
              onClick={() => onTranslation(meta.id)}
              aria-pressed={meta.id === translationId}
            >
              <span className={`lang-dot lang-${meta.lang}`} aria-hidden />
              <span className="translation-abbrev">{meta.abbrev}</span>
              <span className="translation-name">{meta.name}</span>
              <span className="translation-lang">{d.translationLanguage(meta.lang)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="testament-tabs" role="tablist" aria-label={d.bookList}>
        <button
          role="tab"
          aria-selected={tab === "OT"}
          className={tab === "OT" ? "is-active" : ""}
          onClick={() => setTab("OT")}
        >
          {d.oldTestament}
        </button>
        <button
          role="tab"
          aria-selected={tab === "NT"}
          className={tab === "NT" ? "is-active" : ""}
          onClick={() => setTab("NT")}
        >
          {d.newTestament}
        </button>
      </div>

      <nav className="book-list" aria-label={d.bookList}>
        {books.map((b) => (
          <button
            key={b.id}
            className={`book-row${b.id === bookId ? " is-active" : ""}`}
            onClick={() => onBook(b.id)}
            aria-current={b.id === bookId ? "page" : undefined}
          >
            <span className="book-name">{bookName(b)}</span>
            <span className="book-chapters">{b.chapters}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <p>{d.shortcutHint}</p>
      </div>
    </aside>
  );
}
