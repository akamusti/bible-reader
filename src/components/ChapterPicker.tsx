import { useEffect, useRef } from "react";
import type { UiLang } from "../types";
import { t } from "../i18n";
import { CloseIcon } from "./Icons";

interface Props {
  open: boolean;
  bookName: string;
  chapters: number;
  current: number;
  uiLang: UiLang;
  onPick: (chapter: number) => void;
  onClose: () => void;
}

export function ChapterPicker({ open, bookName, chapters, current, uiLang, onPick, onClose }: Props) {
  const d = t(uiLang);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => activeRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" onPointerDown={onClose}>
      <div
        className="dialog chapter-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${bookName} — ${d.chooseChapter}`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-head">
          <div>
            <p className="dialog-kicker">{bookName}</p>
            <h2>{d.chooseChapter}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={d.close} title={d.close}>
            <CloseIcon />
          </button>
        </header>
        <div className="chapter-grid">
          {Array.from({ length: chapters }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              ref={number === current ? activeRef : undefined}
              className={`chapter-cell${number === current ? " is-active" : ""}`}
              onClick={() => onPick(number)}
              aria-current={number === current ? "page" : undefined}
            >
              {number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
