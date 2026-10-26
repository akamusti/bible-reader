# Söz

**A quiet, offline Bible reader for the desktop — Turkish and English, equally at home.**

**English** · [Türkçe](README.tr.md)

[![CI](https://github.com/akamusti/bible-reader/actions/workflows/ci.yml/badge.svg)](https://github.com/akamusti/bible-reader/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform: Linux](https://img.shields.io/badge/platform-Linux-informational)](https://github.com/akamusti/bible-reader/releases)

Söz (Turkish for “the Word”) is a small Tauri 2 desktop application for reading
Scripture without distractions. It bundles the complete Turkish YTC Bible and
the English KJV and WEB, ships every verse as static JSON, and never touches the
network at runtime — no accounts, no telemetry, no ads.

## Design principles

- **Reading first.** Literata for Scripture, Inter for the interface, a 716 px
  measure, and three themes tuned for long sessions.
- **Offline by default.** The text is committed to the repository and loaded
  from disk. There is nothing to sync and nothing that phones home.
- **Bilingual, not localised as an afterthought.** Turkish and English are equal
  citizens; the interface and the Scripture switch together, instantly.
- **A deliberately small surface.** One window, no plugins, no cloud. v0.1 stops
  at reading, and that is the point.

## Features

- Complete 66-book canon — 1,189 chapters in each translation.
- Book list with testament tabs, chapter grid, and previous/next navigation
  that crosses book boundaries.
- Paragraph or verse-per-line layout.
- Light, sepia and dark themes; 15–30 px text size.
- Optional red letter for the words of Jesus, italics for KJV translator
  additions, and small caps for the divine name.
- Remembers translation, book, chapter, theme and layout between launches.
- Keyboard-first: `←` / `→` for chapters, `B` for the sidebar, `T` for the
  theme, `Esc` to close dialogs.

## Translations

| ID      | Language | Translation                        | Abbrev. | License                              |
| ------- | -------- | ---------------------------------- | ------- | ------------------------------------ |
| `tr-ytc`| Turkish  | Yorumsuz Türkçe Çeviri             | YTC     | CC BY-ND 4.0                         |
| `en-kjv`| English  | King James Version                 | KJV     | Public domain outside the UK         |
| `en-web`| English  | World English Bible (Protestant)   | WEB     | Public domain                        |

The repository contains freely redistributable texts only. Copyrighted
translations (NIV, ESV, NLT, …) are intentionally absent. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for sources, copyright lines and
the exact transformations applied to each text.

## Installation

Download the latest bundles from
[Releases](https://github.com/akamusti/bible-reader/releases):

```bash
# AppImage — run directly
chmod +x Soz_*_amd64.AppImage
./Soz_*_amd64.AppImage

# Debian / Ubuntu / KDE Neon
sudo apt install ./Soz_*_amd64.deb

# Fedora
sudo dnf install ./Soz_*_x86_64.rpm
```

The AppImage expects **WebKitGTK 4.1** and **GTK 3** on the host (Fedora:
`webkit2gtk4.1`, `gtk3`). The deb and rpm packages declare their dependencies.

## Development

### Requirements

- Node.js 22+
- Rust stable
- Tauri 2 system dependencies: `webkit2gtk-4.1`, `gtk3`, `libsoup-3.0`,
  `librsvg2`, `patchelf` (`libayatana-appindicator3` is needed for bundling).

On Fedora:

```bash
sudo dnf install webkit2gtk4.1-devel gtk3-devel libsoup3-devel librsvg2-devel \
  libappindicator-gtk3-devel patchelf
```

### Commands

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm ci`          | Install JavaScript dependencies                           |
| `npm run dev`     | Vite dev server only → <http://localhost:1420>            |
| `npm run desktop` | Tauri window (starts Vite automatically)                  |
| `npm run check`   | TypeScript checks plus offline data integrity             |
| `npm run build`   | Type-check and build the production web bundle            |
| `npm run bundle`  | Build AppImage, deb and rpm bundles                       |
| `npm run data`    | Re-download and rebuild `public/data` (requires network)  |

`public/data/` is committed, so a fresh clone builds and runs offline.

### Regenerating the text

```bash
npm run data
```

Sources are pinned by SHA-256 in `scripts/build-bible-data.mjs`; a changed
upstream archive fails the build instead of silently altering Scripture. After
regenerating, run `npm run check` and review `git diff --stat public/data`.

### Project layout

```text
src/                    React 19 + TypeScript UI
  App.tsx               settings, navigation, data loading, shortcuts
  components/           Sidebar, Reader, ChapterPicker, SettingsPanel, Icons
  data.ts               manifest and translation loading (fetch + memory cache)
  storage.ts            localStorage settings
  i18n.ts               Turkish and English UI strings
  styles.css            design tokens, layout, typography
public/data/            generated Bible JSON (committed)
scripts/                USFM → JSON pipeline, data integrity check
src-tauri/              Tauri 2 shell (Rust)
.github/workflows/      CI and release automation
```

Architecture notes, the data model and contribution rules live in
**[AGENTS.md](AGENTS.md)**.

## Contributing

Issues and pull requests are welcome. Before opening a PR, run:

```bash
npm run check
npm run build
```

Keep changes consistent with the principles above: reading comfort, offline
operation, a small footprint, and parity between Turkish and English. Never edit
verse text by hand — regenerate it through the pipeline instead.

## License

- **Code:** MIT — see [LICENSE](LICENSE).
- **Scripture:** YTC under CC BY-ND 4.0; KJV and WEB in the public domain. See
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Fonts:** Literata and Inter, SIL Open Font License 1.1.
