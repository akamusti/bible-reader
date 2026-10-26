# Third-party notices

Söz's source code is MIT-licensed. The bundled Scripture text and fonts are
separate works under their own terms.

---

## Yorumsuz Türkçe Çeviri (YTC) — `tr-ytc`

- **Copyright:** Copyright © 2023–2025 İsmail Serinken and eBible.org
- **License:** Creative Commons Attribution-NoDerivatives 4.0 International
  (CC BY-ND 4.0) — <https://creativecommons.org/licenses/by-nd/4.0/>
- **Source:** <https://ebible.org/details.php?id=turytc>
- **Download used:** <https://ebible.org/Scriptures/turytc_usfm.zip>
- **SHA-256:** `fbf9ef78c6e56fdc2421a41663fd23d03a6dabb6ebd0f8055d73203233d90678`

Changes made for this application: USFM markup was converted to JSON and inline
HTML; footnotes and cross references were moved into a separate `notes` field;
whitespace was normalised. **The wording of the text was not changed, added to or
removed.** The work is redistributed under the same CC BY-ND 4.0 terms.

---

## King James Version (KJV) — `en-kjv`

- **Copyright:** Public domain in most of the world. In the United Kingdom,
  rights are administered under Crown letters patent; consult the source page
  before redistributing there.
- **Source:** <https://ebible.org/details.php?id=eng-kjv>
- **Download used:** <https://ebible.org/Scriptures/eng-kjv_usfm.zip>
- **SHA-256:** `67561758cf58d9e767e89226a99171dba722579157d3894767c2f27538bcb38e`

Changes made for this application: USFM markup converted to JSON/HTML; the
Apocrypha books present in the source archive were omitted so that only the
canonical 66 books are bundled; footnotes moved to `notes`; Strong's-tagged
`\w` markers reduced to their surface text. Wording unchanged.

---

## World English Bible (WEB) — `en-web`

- **Copyright:** Public domain. “World English Bible” is a trademark of
  eBible.org; the text is redistributed unaltered.
- **Source:** <https://ebible.org/details.php?id=engwebp>
- **Download used:** <https://ebible.org/Scriptures/engwebp_usfm.zip>
- **SHA-256:** `d2a7c9640820003d8ed475ce6d92cc990b0447fe96ce72fd0df17c0dac9d95fe`

Changes made for this application: USFM markup converted to JSON/HTML; footnotes
and cross references moved to `notes`; `\w` Strong's markers reduced to their
surface text. Wording unchanged.

---

## Fonts

Both fonts are self-hosted through [Fontsource](https://fontsource.org/) and are
licensed under the **SIL Open Font License 1.1**.

- **Literata** — © TypeTogether, used for Scripture.
- **Inter** — © Rasmus Andersson, used for the interface.

The OFL permits bundling and redistribution; the fonts are not sold on their own
and their reserved font names are not modified.

---

## Build tooling

- [Tauri](https://tauri.app/) — MIT / Apache-2.0
- [React](https://react.dev/) — MIT
- [Vite](https://vite.dev/) — MIT
- [USFM source texts](https://ebible.org/) — see the sections above
