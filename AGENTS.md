# AGENTS.md

Guidance for anyone — human or AI agent — changing this repository. Read this
before editing code or data.

Repository: <https://github.com/akamusti/bible-reader>
App name: **Söz** (Turkish for “the Word”).

---

## 1. What this is

Söz is a small, offline, two-language Bible reader for the desktop. The
interface is Turkish-first and can switch to English; the text can be read in
Turkish (YTC) or English (KJV, WEB). It is built with Tauri 2 (Rust shell) and
React 19 + TypeScript (UI), and ships the full text as static JSON.

Product principles, in order:

1. **Reading comfort** — typography, measure and themes matter more than feature
   count. Long passages must stay pleasant to read.
2. **Offline and quiet** — no accounts, no telemetry, no network at runtime.
3. **Small and fast** — one window, instant chapter turns, no loading spinners
   after the first visit to a translation.
4. **Bilingual by design** — Turkish and English are equal citizens, not an
   afterthought.

### Non-goals for v0.1

Search, notes, highlights, bookmarks, parallel columns, translation import,
audio, mobile targets and cloud sync are deliberately out of scope. Do not add
them unless the task explicitly asks for them. Keep the reader focused.

---

## 2. Quick start

```bash
npm ci                 # install JS dependencies
npm run dev            # Vite only → http://localhost:1420
npm run desktop        # Tauri window (starts Vite itself)
npm run check          # TypeScript + data integrity
npm run build          # type-check + production web bundle
npm run bundle         # Tauri bundles (AppImage, deb, rpm)
npm run data           # re-download + rebuild public/data (network)
```

System requirements on Linux: Node 22+, Rust stable, and the Tauri 2
dependencies — `webkit2gtk-4.1`, `gtk3`, `libsoup-3.0`, `librsvg2`,
`libayatana-appindicator3`, `patchelf`. On Fedora:

```bash
sudo dnf install webkit2gtk4.1-devel gtk3-devel libsoup3-devel librsvg2-devel \
  libappindicator-gtk3-devel patchelf
```

The generated data in `public/data/` is committed, so a clone works offline
without running `npm run data`.

---

## 3. Architecture

```
src/                     React UI
  App.tsx                settings, navigation, data loading, keyboard shortcuts
  components/
    Sidebar.tsx          translation picker, testament tabs, book list
    Reader.tsx           chapter rendering (paragraph / verse layout)
    ChapterPicker.tsx    chapter grid dialog
    SettingsPanel.tsx    theme, text size, layout, red letters, UI language
    Icons.tsx            inline SVG icons
  data.ts                manifest + translation loading (fetch, memory cache)
  storage.ts             localStorage settings (key: soz.settings.v1)
  i18n.ts                Turkish/English UI strings
  types.ts               shared data model
  styles.css             design tokens, layout, typography
public/data/             generated Bible JSON (committed)
scripts/
  build-bible-data.mjs   USFM → JSON pipeline (network, SHA-256 pinned)
  check-data.mjs         offline data integrity check
src-tauri/               Tauri 2 shell (Rust)
  src/lib.rs             app builder (no IPC commands yet)
  tauri.conf.json        window, bundle targets, identifier
  capabilities/          Tauri permissions
.github/workflows/       CI and release (AppImage/deb/rpm → GitHub Release)
```

There is **no Rust business logic** yet. The Rust side only opens the window and
serves the bundled assets. If you add an IPC command, register it in
`src-tauri/src/lib.rs` and add the matching permission in
`src-tauri/capabilities/default.json`.

### Why these choices

- **Tauri over egui/Qt** — a Bible is read for long stretches; CSS gives precise
  control over measure, serif rendering, superscripts and themes at a fraction
  of the effort of a custom layout engine.
- **Static JSON over SQLite** — v0.1 is read-only. One file per translation,
  fetched on demand and cached in memory. When search/notes arrive, add a Rust
  index and SQLite behind an IPC boundary rather than moving the whole UI.
- **Relative Vite base (`base: './'`)** — required for Tauri's custom asset
  protocol. Do not change it to `/`.

---

## 4. Data model

`public/data/manifest.json`

```jsonc
{
  "generated": "ISO-8601",
  "books": [
    {
      "id": "GEN",
      "testament": "OT",          // "OT" | "NT"
      "tr": "Yaratılış",
      "en": "Genesis",
      "trAbbr": "YARATILIŞ",      // YTC's toc3 is a full name, not an abbreviation
      "enAbbr": "Gen",
      "chapters": 50
    }
  ],
  "translations": [
    {
      "id": "tr-ytc",
      "name": "Yorumsuz Türkçe Çeviri",
      "abbrev": "YTC",
      "lang": "tr",
      "langName": "Türkçe",
      "file": "data/tr-ytc.json",
      "license": "CC BY-ND 4.0",
      "licenseUrl": "…",
      "copyright": "…",
      "source": "…",
      "verses": 31059,
      "bookCount": 66
    }
  ]
}
```

`public/data/<id>.json`

```jsonc
{
  "id": "tr-ytc",
  "books": [
    {
      "id": "GEN",
      "name": "Yaratılış",
      "abbrev": "YARATILIŞ",
      "chapters": [
        {
          "n": 1,
          "blocks": [
            { "t": "h", "text": "Başlık", "lvl": 1 },
            { "t": "d", "text": "Mezmur başlığı" },
            { "t": "v", "n": "1", "text": "…", "p": 0, "q": 1 }
          ],
          "notes": [{ "v": "1", "k": "f", "text": "dipnot" }]
        }
      ]
    }
  ]
}
```

Block rules:

- `t: "v"` — a verse. `n` is a string because USFM can merge verses (`"17-18"`).
  `p` groups consecutive prose verses into a paragraph; `q` is the poetry level
  (`0` = prose, `1–4` = poetry). A verse that spans several poetic lines contains
  `<br/>`.
- `t: "h"` — section heading. `lvl: 0` is a minor heading (speaker, Psalm
  title); `lvl >= 1` is a section heading.
- `t: "d"` — chapter superscription / descriptor.
- `notes` — footnotes and cross references preserved verbatim (currently not
  displayed). Keep them: the Turkish text is CC BY-ND and must not be altered.

### Text HTML

Verse `text` is generated HTML, never user input. The only tags the generator
emits are `<em>`, `<strong>`, `<br/>`, `<span class="wj">` (words of Jesus),
`<span class="nd">` (divine name), and a few semantic spans (`bk`, `qt`, `k`,
`pn`, `sig`, `sls`, `rq`). It is rendered with `dangerouslySetInnerHTML`.

If you touch `renderInline()`, keep escaping correct: literal text must go
through `esc()`; only generator-controlled markup may be inserted. Run
`npm run check` — it fails on unresolved USFM markers, unbalanced tags or
`<script>`/event-handler patterns.

---

## 5. Data pipeline

`scripts/build-bible-data.mjs` downloads pinned USFM zips into `data/source/`,
verifies SHA-256, extracts, parses the canonical 66 books and writes JSON.

Sources:

| id | Text | License |
| --- | --- | --- |
| `tr-ytc` | Yorumsuz Türkçe Çeviri | CC BY-ND 4.0 |
| `en-kjv` | King James Version (KJV + Apocrypha source, apocrypha filtered) | Public domain outside the UK |
| `en-web` | World English Bible (Protestant) | Public domain |

Rules:

- **Never edit verse text.** Only strip markup, decode entities, normalise
  whitespace and move footnote/ref content into `notes`.
- **YTC is CC BY-ND 4.0.** Redistribution is allowed with attribution; do not
  modify, remix or reword the text. Do not delete footnotes.
- **Never add a copyrighted translation** (NIV, ESV, NLT, NASB, …) to the repo.
  Online/API translations would need a separate design and the publisher's terms.
- If eBible republishes a source, `npm run data` fails on the SHA check. Review
  the diff, then update `SOURCES[].sha256` in the script **and** record the change
  in the commit message.
- `data/source/` is gitignored. `public/data/` is committed on purpose.
- After regenerating, run `npm run check` and inspect
  `git diff --stat public/data`.

---

## 6. Frontend conventions

### State and persistence

- One `settings` object in `App.tsx` is the source of truth.
- Persisted to `localStorage` under `soz.settings.v1` by `storage.ts`. Storage
  failures are non-fatal (private mode, quota).
- Restored values are validated/clamped before use.
- Changing the **UI language** also switches to the first translation in that
  language, unless the current translation already matches. This keeps the
  “TR / EN” control meaningful. Do not silently decouple them.

### Data loading

- `loadTranslation()` caches resolved translations in a module-level `Map`.
  Keep it that way; do not preload all three translations at boot.
- The manifest is loaded once. Translation files are 5–7 MB each, so avoid
  re-fetching on every navigation.
- All fetches are relative to `import.meta.env.BASE_URL`; do not hardcode `/data`.

### Types and naming

- Shared types live in `src/types.ts`. If you change the JSON shape, update the
  generator, the types and `check-data.mjs` in the same commit.
- Book identity is the USFM code (`GEN`, `1SA`, `REV`). Never key data by
  localized names.
- Turkish casing must use `toLocaleLowerCase('tr-TR')` /
  `toLocaleUpperCase('tr-TR')`; plain `toLowerCase()` turns `I` into `i` and
  breaks `İ`/`I` pairs.

### Design system

- Tokens are CSS custom properties in `src/styles.css`, one block per theme
  (`light`, `sepia`, `dark`).
- Adding a theme requires: a `[data-theme="…"]` token block, a member in
  `Theme` (`src/types.ts`), an entry in `themeOrder` (`App.tsx`), and labels in
  `i18n.ts`.
- Scripture uses **Literata**; chrome uses **Inter** (both self-hosted through
  Fontsource).
- Reading measure is capped at 716 px. Do not let text span a wide window.
- Motion is restrained (150–240 ms, `--ease-out`). Respect
  `prefers-reduced-motion`; the global rule already disables animation.

### Accessibility

- Every icon-only button needs `aria-label` and a `title`.
- Dialogs close on `Escape` and on overlay click.
- Arrow keys change chapters only when no dialog is open and no text field is
  focused.
- Keep visible `:focus-visible` outlines.

---

## 7. Tauri notes

- `productName` is `Soz` (ASCII) because the RPM bundler rejects non-ASCII
  package names; the name users see is `Söz`, set by the window title and by
  `src-tauri/linux/soz.desktop.hbs` (used as the deb/rpm `desktopTemplate`).
  Do not set `productName` back to `Söz` — rpm bundling fails with
  `invalid name "söz"`.
- `frontendDist` is `../dist`; `beforeBuildCommand` runs `npm run build`.
- CSP is `null` in v0.1 because everything is local and trusted. If remote
  content, external links or IPC are introduced, replace it with a strict CSP.
- AppImage does not bundle WebKitGTK; the host needs `webkit2gtk-4.1` and GTK 3.
  Say so in release notes.
- Bundle targets: `appimage`, `deb`, `rpm`.

---

## 8. Verification

Before opening a PR or committing:

```bash
npm run check     # TypeScript + data integrity (must pass)
npm run build     # production bundle
npm run desktop   # manual smoke test
```

Manual checklist:

1. Turkish text loads (Genesis 1) with no console errors.
2. `EN` switches both the interface and the text to English.
3. Chapter picker jumps correctly; previous/next crosses book boundaries.
4. Paragraph ↔ verse layout, all three themes, text size and red letters work.
5. Reload restores translation, book, chapter, theme and layout.
6. Arrow keys, `B` (sidebar) and `T` (theme) work; they do nothing while a
   dialog is open.
7. `npm run data` still reproduces identical data when sources are unchanged.

Screenshots are optional; the checks above are the contract.

---

## 9. Git and commits

- Branch from `main`; do not force-push `main`.
- Subjects use a short conventional prefix: `feat:`, `fix:`, `docs:`, `chore:`,
  `data:`, `ci:`.
- Keep generated data changes in their own commit (`data: …`) when practical, so
  code diffs stay readable.
- **Every commit authored by an AI agent must end with a co-author trailer**
  naming the agent/model, separated from the body by one blank line:

  ```text
  Co-authored-by: DeepSeek V4.1 Flash <noreply@opencode.ai>
  ```

  Replace the name/model when a different agent wrote the commit. Do not omit
  the trailer for agent-authored changes.
- Never commit `node_modules/`, `dist/`, `data/source/`, `src-tauri/target/` or
  `src-tauri/gen/`.

### Documentation

- `README.md` is the English landing page; `README.tr.md` is its full Turkish
  mirror. Both start with the same language switcher — keep the order
  (`English · Türkçe`) and the link targets intact so readers can switch with one
  click.
- When features, commands, requirements, keyboard shortcuts or licensing change,
  update **both** files in the same commit. The Turkish page is not a summary:
  it carries the same sections and the same facts.
- `THIRD_PARTY_NOTICES.md` and `AGENTS.md` stay English-only, because they are
  legal and engineering references.

---

## 10. Known limitations and sensible next steps

- No search. The natural next step is a Rust command that builds an inverted
  index once (per translation) and returns hits with book/chapter/verse.
- No notes/highlights/bookmarks. Use SQLite through a Tauri command; keep the
  JSON text files immutable.
- Turkish book abbreviations are full names (the source has no real `toc3`);
  the UI does not display them. If compact labels are needed, add a canonical
  abbreviation map rather than deriving one at runtime.
- KJV source includes the Apocrypha; it is filtered by the canonical book list.
  Do not “fix” the count warnings by loosening the filter.
- macOS and Windows are untested; icons and Tauri config are in place.
- `notes` are stored but not surfaced. A footnote popover is a good first
  follow-up, especially for the Turkish text.
- No automated UI tests yet. If adding them, prefer Playwright against
  `npm run dev` and keep the data check separate.
