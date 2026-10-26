import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { loadManifest, loadTranslation } from "./data";
import { loadSettings, saveSettings } from "./storage";
import type { Manifest, Settings, Theme, Translation, UiLang } from "./types";
import { t, themeLabels } from "./i18n";
import { Sidebar } from "./components/Sidebar";
import { Reader } from "./components/Reader";
import { ChapterPicker } from "./components/ChapterPicker";
import { SettingsPanel } from "./components/SettingsPanel";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "./components/Icons";

const themeOrder: Theme[] = ["light", "sepia", "dark"];

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [showChapters, setShowChapters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // Load the book index once.
  useEffect(() => {
    let alive = true;
    setError(null);
    loadManifest()
      .then((data) => {
        if (!alive) return;
        setManifest(data);
        setSettings((prev) => {
          const meta = data.translations.find((item) => item.id === prev.translationId) ?? data.translations[0];
          const book = data.books.find((item) => item.id === prev.bookId) ?? data.books[0];
          return {
            ...prev,
            translationId: meta.id,
            bookId: book.id,
            chapter: Math.min(Math.max(1, prev.chapter), book.chapters),
          };
        });
      })
      .catch(() => {
        if (alive) setError("manifest");
      });
    return () => {
      alive = false;
    };
  }, [bootAttempt]);

  // Load the selected translation (cached after the first visit).
  useEffect(() => {
    if (!manifest) return;
    const meta = manifest.translations.find((item) => item.id === settings.translationId);
    if (!meta) return;
    let alive = true;
    setLoading(true);
    setError(null);
    loadTranslation(meta)
      .then((data) => {
        if (!alive) return;
        setTranslation(data);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("translation");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [manifest, settings.translationId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.lang = settings.uiLang;
    root.style.colorScheme = settings.theme === "dark" ? "dark" : "light";
  }, [settings.theme, settings.uiLang]);

  const d = t(settings.uiLang);
  const uiLang = settings.uiLang;
  const bookMeta = manifest?.books.find((item) => item.id === settings.bookId) ?? manifest?.books[0];
  const meta = manifest?.translations.find((item) => item.id === settings.translationId);
  const book = translation?.books.find((item) => item.id === settings.bookId) ?? translation?.books[0];
  const chapter = book?.chapters.find((item) => item.n === settings.chapter) ?? book?.chapters[0];

  const bookName = bookMeta ? (uiLang === "tr" ? bookMeta.tr : bookMeta.en) : "Söz";

  useEffect(() => {
    document.title = `${bookName} ${settings.chapter} — Söz`;
  }, [bookName, settings.chapter]);

  const refs = useMemo(
    () =>
      manifest
        ? manifest.books.flatMap((item) =>
            Array.from({ length: item.chapters }, (_, index) => ({ bookId: item.id, chapter: index + 1 })),
          )
        : [],
    [manifest],
  );

  const index = refs.findIndex((item) => item.bookId === settings.bookId && item.chapter === settings.chapter);
  const prevRef = index > 0 ? refs[index - 1] : null;
  const nextRef = index >= 0 && index < refs.length - 1 ? refs[index + 1] : null;

  const labelFor = useCallback(
    (ref: { bookId: string; chapter: number } | null) => {
      if (!ref || !manifest) return null;
      const entry = manifest.books.find((item) => item.id === ref.bookId);
      return { book: entry ? (uiLang === "tr" ? entry.tr : entry.en) : ref.bookId, chapter: ref.chapter };
    },
    [manifest, uiLang],
  );

  const go = useCallback(
    (bookId: string, chapterNumber: number) => {
      update({ bookId, chapter: chapterNumber });
      setShowChapters(false);
      setShowSettings(false);
      if (window.innerWidth < 900) update({ sidebarOpen: false });
      window.scrollTo(0, 0);
    },
    [update],
  );

  const goPrev = useCallback(() => {
    if (prevRef) go(prevRef.bookId, prevRef.chapter);
  }, [prevRef, go]);

  const goNext = useCallback(() => {
    if (nextRef) go(nextRef.bookId, nextRef.chapter);
  }, [nextRef, go]);

  const cycleTheme = useCallback(() => {
    const next = themeOrder[(themeOrder.indexOf(settings.theme) + 1) % themeOrder.length];
    update({ theme: next });
  }, [settings.theme, update]);

  const changeUiLang = useCallback(
    (lang: UiLang) => {
      if (lang === settings.uiLang) return;
      const patch: Partial<Settings> = { uiLang: lang };
      const current = manifest?.translations.find((item) => item.id === settings.translationId);
      if (manifest && current && current.lang !== lang) {
        const target = manifest.translations.find((item) => item.lang === lang);
        if (target) patch.translationId = target.id;
      }
      update(patch);
    },
    [manifest, settings.translationId, settings.uiLang, update],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (showChapters || showSettings) return;

      if (event.key === "ArrowLeft") {
        if (!prevRef) return;
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        if (!nextRef) return;
        event.preventDefault();
        goNext();
      } else if (event.key.toLowerCase() === "b") {
        update({ sidebarOpen: !settings.sidebarOpen });
      } else if (event.key.toLowerCase() === "t") {
        cycleTheme();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevRef, nextRef, showChapters, showSettings, settings.sidebarOpen, update, goPrev, goNext, cycleTheme]);

  const retry = () => {
    if (!manifest) {
      setBootAttempt((value) => value + 1);
      return;
    }
    const current = manifest.translations.find((item) => item.id === settings.translationId);
    if (!current) return;
    setLoading(true);
    setError(null);
    loadTranslation(current)
      .then((data) => {
        setTranslation(data);
        setLoading(false);
      })
      .catch(() => {
        setError("translation");
        setLoading(false);
      });
  };

  if (!manifest || (!translation && loading)) {
    return (
      <div className="splash" data-theme={settings.theme}>
        <div className="splash-mark">Söz</div>
        <div className="splash-sub">{t(settings.uiLang).appSubtitle}</div>
        {error ? (
          <div className="splash-error">
            <p>{t(settings.uiLang).loadError}</p>
            <button className="btn" onClick={retry}>
              {t(settings.uiLang).retry}
            </button>
          </div>
        ) : (
          <div className="spinner" role="status" aria-label={t(settings.uiLang).loading} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`app${settings.sidebarOpen ? " sidebar-open" : ""}${settings.redLetters ? " red-letters" : ""}`}
      data-theme={settings.theme}
    >
      {settings.sidebarOpen && (
        <div className="scrim" onClick={() => update({ sidebarOpen: false })} aria-hidden />
      )}

      {manifest && (
        <Sidebar
          open={settings.sidebarOpen}
          manifest={manifest}
          uiLang={uiLang}
          translationId={settings.translationId}
          bookId={settings.bookId}
          onTranslation={(id) => update({ translationId: id })}
          onBook={(id) => go(id, 1)}
          onClose={() => update({ sidebarOpen: false })}
        />
      )}

      <div
        className="main"
        style={{ "--reader-size": `${settings.fontSize}px` } as CSSProperties}
      >
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => update({ sidebarOpen: !settings.sidebarOpen })}
            aria-label={d.menu}
            aria-expanded={settings.sidebarOpen}
          >
            <MenuIcon />
          </button>

          <div className="crumb">
            <button className="crumb-book" onClick={() => update({ sidebarOpen: true })} title={d.bookList}>
              {bookName}
            </button>
            <span className="crumb-sep" aria-hidden>
              /
            </span>
            <button
              className="crumb-chapter"
              onClick={() => setShowChapters(true)}
              aria-haspopup="dialog"
              title={d.chooseChapter}
            >
              {d.chapter} {settings.chapter}
            </button>
          </div>

          <div className="topbar-actions">
            <div className="nav-buttons">
              <button
                className="icon-btn"
                onClick={goPrev}
                disabled={!prevRef}
                aria-label={d.previousChapter}
                title={d.previousChapter}
              >
                <ChevronLeftIcon />
              </button>
              <button
                className="icon-btn"
                onClick={goNext}
                disabled={!nextRef}
                aria-label={d.nextChapter}
                title={d.nextChapter}
              >
                <ChevronRightIcon />
              </button>
            </div>

            <div className="lang-switch" role="group" aria-label={d.language}>
              <button
                className={uiLang === "tr" ? "is-active" : ""}
                onClick={() => changeUiLang("tr")}
                aria-pressed={uiLang === "tr"}
              >
                TR
              </button>
              <button
                className={uiLang === "en" ? "is-active" : ""}
                onClick={() => changeUiLang("en")}
                aria-pressed={uiLang === "en"}
              >
                EN
              </button>
            </div>

            <button
              className="icon-btn"
              onClick={cycleTheme}
              aria-label={`${d.theme}: ${d[themeLabels[settings.theme]]}`}
              title={d[themeLabels[settings.theme]]}
            >
              {settings.theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <div className="settings-anchor">
              <button
                className={`icon-btn${showSettings ? " is-active" : ""}`}
                onClick={() => setShowSettings((value) => !value)}
                aria-label={d.settings}
                aria-expanded={showSettings}
                title={d.settings}
              >
                <SettingsIcon />
              </button>
              {meta && (
                <SettingsPanel
                  open={showSettings}
                  settings={settings}
                  meta={meta}
                  onChange={update}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>
          </div>
        </header>

        <main className="main-scroll">
          {error === "translation" && (
            <div className="banner" role="alert">
              <span>{d.loadError}</span>
              <button className="btn btn-small" onClick={retry}>
                {d.retry}
              </button>
            </div>
          )}

          {translation && book && chapter ? (
            <Reader
              key={`${settings.translationId}-${settings.bookId}-${settings.chapter}`}
              translation={translation}
              book={book}
              chapter={chapter}
              layout={settings.layout}
              uiLang={uiLang}
              prev={labelFor(prevRef)}
              next={labelFor(nextRef)}
              onPrev={goPrev}
              onNext={goNext}
              onOpenPicker={() => setShowChapters(true)}
            />
          ) : (
            <div className="loading-state">
              <div className="spinner" role="status" aria-label={d.loading} />
              <p>{d.loading}</p>
            </div>
          )}
        </main>
      </div>

      <ChapterPicker
        open={showChapters}
        bookName={bookName}
        chapters={bookMeta?.chapters ?? 1}
        current={settings.chapter}
        uiLang={uiLang}
        onPick={(chapterNumber) => go(settings.bookId, chapterNumber)}
        onClose={() => setShowChapters(false)}
      />
    </div>
  );
}
