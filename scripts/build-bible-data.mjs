#!/usr/bin/env node
/**
 * Builds the bundled Bible data from pinned USFM sources.
 *
 *   node scripts/build-bible-data.mjs [--force]
 *
 * Downloads (once) into data/source/, verifies SHA-256, extracts, parses the
 * canonical 66 books and writes public/data/*.json.
 *
 * The parser keeps the text verbatim, including footnotes and cross references
 * (stored separately as `notes`, hidden by the v0.1 reader). Only markup is
 * removed. See THIRD_PARTY_NOTICES.md for licensing.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "data", "source");
const OUT_DIR = path.join(ROOT, "public", "data");
const FORCE = process.argv.includes("--force");

const SOURCES = [
  {
    id: "tr-ytc",
    lang: "tr",
    langName: "Türkçe",
    name: "Yorumsuz Türkçe Çeviri",
    abbrev: "YTC",
    url: "https://ebible.org/Scriptures/turytc_usfm.zip",
    sha256: "fbf9ef78c6e56fdc2421a41663fd23d03a6dabb6ebd0f8055d73203233d90678",
    source: "https://ebible.org/details.php?id=turytc",
    license: "CC BY-ND 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nd/4.0/",
    copyright: "Copyright © 2023–2025 İsmail Serinken and eBible.org",
  },
  {
    id: "en-kjv",
    lang: "en",
    langName: "English",
    name: "King James Version",
    abbrev: "KJV",
    url: "https://ebible.org/Scriptures/eng-kjv_usfm.zip",
    sha256: "67561758cf58d9e767e89226a99171dba722579157d3894767c2f27538bcb38e",
    source: "https://ebible.org/details.php?id=eng-kjv",
    license: "Public Domain (outside the United Kingdom)",
    licenseUrl: "https://ebible.org/details.php?id=eng-kjv",
    copyright: "Public domain; Crown letters patent apply in the United Kingdom.",
  },
  {
    id: "en-web",
    lang: "en",
    langName: "English",
    name: "World English Bible",
    abbrev: "WEB",
    url: "https://ebible.org/Scriptures/engwebp_usfm.zip",
    sha256: "d2a7c9640820003d8ed475ce6d92cc990b0447fe96ce72fd0df17c0dac9d95fe",
    source: "https://ebible.org/details.php?id=engwebp",
    license: "Public Domain",
    licenseUrl: "https://ebible.org/details.php?id=engwebp",
    copyright: "Public domain. “World English Bible” is a trademark of eBible.org.",
  },
];

const CANON = [
  ["GEN", "OT", 50], ["EXO", "OT", 40], ["LEV", "OT", 27], ["NUM", "OT", 36],
  ["DEU", "OT", 34], ["JOS", "OT", 24], ["JDG", "OT", 21], ["RUT", "OT", 4],
  ["1SA", "OT", 31], ["2SA", "OT", 24], ["1KI", "OT", 22], ["2KI", "OT", 25],
  ["1CH", "OT", 29], ["2CH", "OT", 36], ["EZR", "OT", 10], ["NEH", "OT", 13],
  ["EST", "OT", 10], ["JOB", "OT", 42], ["PSA", "OT", 150], ["PRO", "OT", 31],
  ["ECC", "OT", 12], ["SNG", "OT", 8], ["ISA", "OT", 66], ["JER", "OT", 52],
  ["LAM", "OT", 5], ["EZK", "OT", 48], ["DAN", "OT", 12], ["HOS", "OT", 14],
  ["JOL", "OT", 3], ["AMO", "OT", 9], ["OBA", "OT", 1], ["JON", "OT", 4],
  ["MIC", "OT", 7], ["NAM", "OT", 3], ["HAB", "OT", 3], ["ZEP", "OT", 3],
  ["HAG", "OT", 2], ["ZEC", "OT", 14], ["MAL", "OT", 4],
  ["MAT", "NT", 28], ["MRK", "NT", 16], ["LUK", "NT", 24], ["JHN", "NT", 21],
  ["ACT", "NT", 28], ["ROM", "NT", 16], ["1CO", "NT", 16], ["2CO", "NT", 13],
  ["GAL", "NT", 6], ["EPH", "NT", 6], ["PHP", "NT", 4], ["COL", "NT", 4],
  ["1TH", "NT", 5], ["2TH", "NT", 3], ["1TI", "NT", 6], ["2TI", "NT", 4],
  ["TIT", "NT", 3], ["PHM", "NT", 1], ["HEB", "NT", 13], ["JAS", "NT", 5],
  ["1PE", "NT", 5], ["2PE", "NT", 3], ["1JN", "NT", 5], ["2JN", "NT", 1],
  ["3JN", "NT", 1], ["JUD", "NT", 1], ["REV", "NT", 22],
];
const CANON_IDS = new Set(CANON.map(([id]) => id));
const CANON_ORDER = new Map(CANON.map(([id], i) => [id, i]));

// Markers whose content is kept but wrapped in a tag.
const OPEN_TAGS = {
  add: "<em>",
  it: "<em>",
  wj: '<span class="wj">',
  nd: '<span class="nd">',
  sc: '<span class="sc">',
  bd: "<strong>",
  tl: "<em>",
  bk: '<span class="bk">',
  k: '<span class="k">',
  pn: '<span class="pn">',
  qt: '<span class="qt">',
  qs: '<span class="qt">',
  sig: '<span class="sig">',
  sls: '<span class="sls">',
  rq: '<span class="rq">',
};

// Markers that are silently dropped (with their text argument where relevant).
const DROP_WITH_ARG = /^\\(?:ca|va|vp|jmp)\s+\S+\s*/;
const DROP_EMPTY = new Set(["ca", "va", "vp", "jmp", "w", "fig"]);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

function extract(zip, dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  execFileSync("unzip", ["-o", "-q", zip, "-d", dir], { stdio: "inherit" });
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function collapse(s) {
  return s.replace(/\s+/g, " ").trim();
}

function stripMarkers(s) {
  return collapse(
    s
      .replace(/\\\+[a-z0-9]+\*?/gi, " ")
      .replace(/\\w\s+([^|\\]*?)(?:\|[^\\]*)?\\w\*/g, "$1")
      .replace(/\\[a-z0-9]+\*?/gi, " "),
  );
}

function hasUnclosed(line) {
  for (const m of ["f", "x", "fig"]) {
    const re = new RegExp(`\\\\${m}(?![a-z0-9*])`, "gi");
    const closeRe = new RegExp(`\\\\${m}\\*`, "gi");
    const opens = (line.match(re) || []).length;
    const closes = (line.match(closeRe) || []).length;
    if (opens > closes) return true;
  }
  return false;
}

/** Join lines that continue a footnote / cross-reference / figure. */
function unwrap(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const out = [];
  let buf = null;
  for (const line of lines) {
    if (buf !== null) {
      buf += " " + line;
      if (!hasUnclosed(buf)) {
        out.push(buf);
        buf = null;
      }
      continue;
    }
    if (hasUnclosed(line)) {
      buf = line;
      continue;
    }
    out.push(line);
  }
  if (buf !== null) out.push(buf);
  return out;
}

/** Renders USFM inline text to escaped HTML. Notes are collected separately. */
function renderInline(raw, notes, verseNumber) {
  let s = raw;

  // Footnotes and cross references: keep the text in `notes`, out of the verse.
  s = s.replace(/\\([fx])\s+([\s\S]*?)\\[fx]\*/g, (_m, kind, body) => {
    const text = stripMarkers(body);
    if (text) notes.push({ v: verseNumber, k: kind, text });
    return " ";
  });
  s = s.replace(/\\fig\s+[\s\S]*?\\fig\*/g, " ");

  // Nested variants, e.g. \nd \+w LORD|strong="H3068"\+w*\nd*
  s = s.replace(/\\\+w\s+([^|\\]*?)(?:\|[^\\]*)?\\\+w\*/g, "$1");
  s = s.replace(/\\\+[a-z0-9]+\*?/gi, " ");

  // \w word|lemma="..."\w* -> word
  s = s.replace(/\\w\s+([^|\\]*?)(?:\|[^\\]*)?\\w\*/g, "$1");

  // Markers that take an argument we drop entirely.
  s = s.replace(DROP_WITH_ARG, " ");

  let out = "";
  let last = 0;
  const stack = [];
  const re = /\\([a-z0-9]+)(\*?)/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    out += esc(s.slice(last, m.index));
    last = re.lastIndex;
    const marker = m[1].toLowerCase();
    const closing = m[2] === "*";
    if (DROP_EMPTY.has(marker)) continue;
    if (closing) {
      const idx = stack.map((x) => x.marker).lastIndexOf(marker);
      if (idx !== -1) {
        while (stack.length > idx) out += "</span>".replace("span", stack.pop().tag);
      }
      continue;
    }
    const tag = OPEN_TAGS[marker];
    if (tag) {
      out += tag;
      stack.push({ marker, tag: tag.replace(/[<>/]/g, "").replace(/^(\w+).*$/, "$1") });
    }
  }
  out += esc(s.slice(last));
  while (stack.length) out += "</span>".replace("span", stack.pop().tag);

  return collapse(out.replace(/<span class="wj">\s*<\/span>/g, ""))
    .replace(/(<(?:span|em|strong)[^>]*>)\s+/g, "$1")
    .replace(/^¶\s*/, "")
    .replace(/\uE000/g, "<br/>");
}

function parseBook(text, source) {
  const lines = unwrap(text);
  const book = { id: null, name: "", abbrev: "", chapters: [] };
  let chapter = null;
  let verse = null;
  let para = -1;
  let qLevel = 0;
  let heading = null;

  const flushVerse = () => {
    if (!verse || !chapter) return;
    const html = renderInline(verse.raw, chapter.notes, verse.n);
    if (html) {
      chapter.blocks.push({ t: "v", n: verse.n, text: html, p: verse.p, q: verse.q });
    }
    verse = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const m = /^\\([a-z0-9]+)\*?\s*([\s\S]*)$/.exec(line);
    if (!m) {
      if (verse) verse.raw += " " + line;
      else if (heading) heading.text += " " + line;
      continue;
    }

    let marker = m[1].toLowerCase();
    let rest = m[2] ?? "";

    // "\q1 \v 1 ..." — a poetry line that starts a verse.
    if (/^q[a-z0-9]*$/.test(marker) && /^\\v\b/.test(rest)) {
      qLevel = Number(marker.replace(/\D/g, "")) || 1;
      const vm = /^\\v\s+(\S+)\s*([\s\S]*)$/.exec(rest);
      if (vm) {
        flushVerse();
        verse = { n: vm[1], raw: vm[2], p: para, q: qLevel };
      }
      continue;
    }

    if (
      !chapter &&
      marker !== "c" &&
      !["id", "ide", "h", "toc1", "toc2", "toc3", "mt1", "mt2", "mt3", "is", "ip", "imt1", "rem", "sts", "usfm"].includes(marker)
    ) {
      // Ignore front matter until the first chapter.
      continue;
    }

    switch (marker) {
      case "id":
        book.id = (rest.match(/^(\S+)/) || [])[1] || null;
        break;
      case "h":
        book.name = collapse(rest);
        break;
      case "toc1":
        if (!book.name) book.name = collapse(rest);
        break;
      case "toc3":
        book.abbrev = collapse(rest);
        break;
      case "c": {
        flushVerse();
        const num = parseInt(rest.trim().split(/\s+/)[0], 10);
        chapter = { n: Number.isFinite(num) ? num : book.chapters.length + 1, blocks: [], notes: [] };
        book.chapters.push(chapter);
        para = -1;
        qLevel = 0;
        heading = null;
        break;
      }
      case "v": {
        flushVerse();
        const vm = /^(\S+)\s*([\s\S]*)$/.exec(rest);
        if (vm && chapter) {
          verse = { n: vm[1], raw: vm[2], p: para, q: qLevel };
        }
        break;
      }
      case "d": {
        flushVerse();
        const text = renderInline(rest, chapter?.notes ?? [], "0");
        if (text && chapter) chapter.blocks.push({ t: "d", text });
        break;
      }
      case "cl":
      case "sp":
      case "qa": {
        flushVerse();
        const text = renderInline(rest, chapter?.notes ?? [], "0");
        if (text && chapter) chapter.blocks.push({ t: "h", text, lvl: 0 });
        break;
      }
      case "s1":
      case "s2":
      case "s3":
      case "s4":
      case "ms1":
      case "ms2":
      case "ms3":
      case "mr":
      case "sr":
      case "r": {
        flushVerse();
        const text = renderInline(rest, chapter?.notes ?? [], "0");
        if (text && chapter) {
          chapter.blocks.push({ t: "h", text, lvl: Number(marker.replace(/\D/g, "")) || 1 });
        }
        break;
      }
      case "p":
      case "m":
      case "mi":
      case "pc":
      case "pr":
      case "nb":
      case "pi":
      case "pi1":
      case "pi2":
      case "pi3":
      case "ph":
      case "ph1":
      case "ph2":
      case "ph3":
      case "li":
      case "li1":
      case "li2":
      case "li3":
      case "li4":
      case "lf":
      case "lim":
      case "lh":
        para += 1;
        qLevel = 0;
        if (verse && rest.trim()) verse.raw += " " + rest;
        break;
      case "b":
        flushVerse();
        para += 1;
        break;
      case "q":
      case "q1":
      case "q2":
      case "q3":
      case "q4":
      case "qr":
      case "qc":
      case "qm":
      case "qd": {
        const level = Number(marker.replace(/\D/g, "")) || 1;
        if (verse) {
          if (qLevel === 0) {
            verse.q = level;
            qLevel = level;
          }
          verse.raw += "\uE000" + rest;
        } else {
          const text = renderInline(rest, chapter?.notes ?? [], "0");
          if (text && chapter) chapter.blocks.push({ t: "h", text, lvl: 0 });
        }
        break;
      }
      default:
        // Unknown structural marker: treat as continuation so no text is lost.
        if (verse) verse.raw += " " + rest;
        else if (heading) heading.text += " " + rest;
        break;
    }
  }
  flushVerse();
  return book;
}

function titleCaseTr(s) {
  const lower = s.toLocaleLowerCase("tr-TR");
  return lower.replace(/(^|[\s\-–—./(]+)(\p{L})/gu, (_m, p, c) => p + c.toLocaleUpperCase("tr-TR"));
}

function pickName(book, lang) {
  const raw = collapse(book.name || "").replace(/\s+/g, " ");
  if (lang === "tr" && raw === raw.toLocaleUpperCase("tr-TR")) return titleCaseTr(raw);
  return raw;
}

async function main() {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const parsed = {};

  for (const src of SOURCES) {
    const zip = path.join(SOURCE_DIR, `${src.id}.zip`);
    const dir = path.join(SOURCE_DIR, src.id);

    if (FORCE || !fs.existsSync(zip)) {
      console.log(`↓ ${src.id}: ${src.url}`);
      await download(src.url, zip);
    }
    const hash = sha256(zip);
    if (hash !== src.sha256) {
      throw new Error(
        `${src.id}: SHA-256 mismatch\n  expected ${src.sha256}\n  actual   ${hash}\n` +
          `If eBible republished the text, review the diff, then update SOURCES in this script.`,
      );
    }
    if (FORCE || !fs.existsSync(dir) || fs.readdirSync(dir).length === 0) {
      extract(zip, dir);
    }

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".usfm"))
      .sort();

    const books = new Map();
    for (const file of files) {
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      const idm = /^\\id\s+(\S+)/m.exec(text);
      if (!idm) continue;
      const id = idm[1].toUpperCase();
      if (!CANON_IDS.has(id)) continue;
      const book = parseBook(text, src);
      if (!book.id) book.id = id;
      book.id = id;
      book.name = pickName(book, src.lang);
      if (!book.abbrev) book.abbrev = book.name.slice(0, 3);
      books.set(id, book);
    }

    const ordered = CANON.map(([id]) => id).map((id) => books.get(id)).filter(Boolean);
    for (const book of ordered) {
      const expected = CANON.find(([id]) => id === book.id)[2];
      if (book.chapters.length !== expected) {
        console.warn(`  ! ${src.id}/${book.id}: ${book.chapters.length} chapters (expected ${expected})`);
      }
      for (const ch of book.chapters) {
        if (ch.blocks.length === 0) console.warn(`  ! ${src.id}/${book.id} ${ch.n}: empty chapter`);
      }
    }

    const verses = ordered.reduce(
      (n, b) => n + b.chapters.reduce((m, c) => m + c.blocks.filter((x) => x.t === "v").length, 0),
      0,
    );

    parsed[src.id] = { source: src, books: ordered, verses };
    console.log(`✓ ${src.id}: ${ordered.length} books, ${verses} verses`);
  }

  // Canonical book index, with names in both UI languages.
  const trBooks = new Map(parsed["tr-ytc"].books.map((b) => [b.id, b]));
  const enBooks = new Map(parsed["en-web"].books.map((b) => [b.id, b]));
  const books = CANON.map(([id, testament]) => {
    const tr = trBooks.get(id);
    const en = enBooks.get(id);
    return {
      id,
      testament,
      tr: tr?.name ?? id,
      en: en?.name ?? id,
      trAbbr: tr?.abbrev ?? id,
      enAbbr: en?.abbrev ?? id,
      chapters: tr?.chapters.length ?? 0,
    };
  });

  for (const [id, { source, books: bookList, verses }] of Object.entries(parsed)) {
    const payload = {
      id: source.id,
      name: source.name,
      abbrev: source.abbrev,
      lang: source.lang,
      langName: source.langName,
      license: source.license,
      licenseUrl: source.licenseUrl,
      copyright: source.copyright,
      source: source.source,
      verses,
      books: bookList.map((b) => ({
        id: b.id,
        name: b.name,
        abbrev: b.abbrev,
        chapters: b.chapters,
      })),
    };
    const file = path.join(OUT_DIR, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(payload));
    const kb = (fs.statSync(file).size / 1024).toFixed(0);
    console.log(`  → ${path.relative(ROOT, file)} (${kb} KB)`);
  }

  const manifest = {
    generated: new Date().toISOString(),
    books,
    translations: SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      abbrev: s.abbrev,
      lang: s.lang,
      langName: s.langName,
      file: `data/${s.id}.json`,
      license: s.license,
      licenseUrl: s.licenseUrl,
      copyright: s.copyright,
      source: s.source,
      verses: parsed[s.id].verses,
      bookCount: parsed[s.id].books.length,
    })),
  };
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`  → public/data/manifest.json (${books.length} books)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
