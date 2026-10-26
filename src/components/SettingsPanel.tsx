import { useEffect, useRef } from "react";
import type { Settings, Theme, TranslationMeta, UiLang } from "../types";
import { layoutLabels, t, themeLabels } from "../i18n";
import { CheckIcon, CloseIcon } from "./Icons";

interface Props {
  open: boolean;
  settings: Settings;
  meta: TranslationMeta;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

const themes: Theme[] = ["light", "sepia", "dark"];

export function SettingsPanel({ open, settings, meta, onChange, onClose }: Props) {
  const d = t(settings.uiLang);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="popover settings-panel" ref={ref} role="dialog" aria-modal="false" aria-label={d.settings}>
      <header className="popover-head">
        <h2>{d.settings}</h2>
        <button className="icon-btn" onClick={onClose} aria-label={d.close} title={d.close}>
          <CloseIcon size={16} />
        </button>
      </header>

      <section className="setting">
        <div className="setting-row">
          <span className="setting-label">{d.theme}</span>
        </div>
        <div className="theme-row">
          {themes.map((theme) => (
            <button
              key={theme}
              className={`theme-option${settings.theme === theme ? " is-active" : ""}`}
              onClick={() => onChange({ theme })}
              aria-pressed={settings.theme === theme}
            >
              <span className={`theme-preview theme-${theme}`} aria-hidden>
                Aa
              </span>
              <span>{d[themeLabels[theme]]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="setting">
        <div className="setting-row">
          <span className="setting-label">{d.textSize}</span>
          <div className="stepper">
            <button
              onClick={() => onChange({ fontSize: Math.max(15, settings.fontSize - 1) })}
              aria-label={d.fontSizeSmaller}
              disabled={settings.fontSize <= 15}
            >
              A−
            </button>
            <span className="stepper-value">{settings.fontSize}</span>
            <button
              onClick={() => onChange({ fontSize: Math.min(30, settings.fontSize + 1) })}
              aria-label={d.fontSizeLarger}
              disabled={settings.fontSize >= 30}
            >
              A+
            </button>
          </div>
        </div>
      </section>

      <section className="setting">
        <div className="setting-row">
          <span className="setting-label">{d.layout}</span>
        </div>
        <div className="segmented">
          {(["paragraph", "verse"] as const).map((layout) => (
            <button
              key={layout}
              className={settings.layout === layout ? "is-active" : ""}
              onClick={() => onChange({ layout })}
              aria-pressed={settings.layout === layout}
            >
              {d[layoutLabels[layout]]}
            </button>
          ))}
        </div>
      </section>

      <section className="setting">
        <button
          className="switch-row"
          role="switch"
          aria-checked={settings.redLetters}
          onClick={() => onChange({ redLetters: !settings.redLetters })}
        >
          <span>
            <span className="setting-label">{d.redLetters}</span>
            <span className="setting-hint">{d.redLettersHint}</span>
          </span>
          <span className={`switch${settings.redLetters ? " is-on" : ""}`} aria-hidden>
            <span className="switch-knob" />
          </span>
        </button>
      </section>

      <section className="setting">
        <div className="setting-row">
          <span className="setting-label">{d.language}</span>
        </div>
        <div className="segmented">
          {(["tr", "en"] as UiLang[]).map((lang) => (
            <button
              key={lang}
              className={settings.uiLang === lang ? "is-active" : ""}
              onClick={() => onChange({ uiLang: lang })}
              aria-pressed={settings.uiLang === lang}
            >
              {lang === "tr" ? "Türkçe" : "English"}
            </button>
          ))}
        </div>
      </section>

      <footer className="about-block">
        <div className="about-title">
          <CheckIcon size={14} />
          <span>
            {meta.name} ({meta.abbrev})
          </span>
        </div>
        <p>
          {d.license}: {meta.license}
        </p>
        <p className="about-copyright">{meta.copyright}</p>
        <p className="about-copyright">Söz 0.1.0 · MIT</p>
      </footer>
    </div>
  );
}
