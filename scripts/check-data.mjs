#!/usr/bin/env node
/**
 * Validates the generated Bible data without touching the network.
 * Run with `npm run check` (also part of CI).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "public", "data");

const EXPECTED = {
  "tr-ytc": { chapters: 1189, minVerses: 30500 },
  "en-kjv": { chapters: 1189, minVerses: 31000 },
  "en-web": { chapters: 1189, minVerses: 30500 },
};

const problems = [];
const fail = (message) => problems.push(message);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${path.relative(ROOT, file)}: ${error.message}`);
    return null;
  }
}

const manifest = readJson(path.join(DATA, "manifest.json"));
if (manifest) {
  if (manifest.books?.length !== 66) fail(`manifest: ${manifest.books?.length} books (expected 66)`);
  if (manifest.translations?.length !== 3) fail(`manifest: ${manifest.translations?.length} translations`);

  const ot = manifest.books?.filter((b) => b.testament === "OT").length;
  const nt = manifest.books?.filter((b) => b.testament === "NT").length;
  if (ot !== 39) fail(`manifest: ${ot} Old Testament books (expected 39)`);
  if (nt !== 27) fail(`manifest: ${nt} New Testament books (expected 27)`);

  for (const book of manifest.books ?? []) {
    if (!book.tr || !book.en) fail(`manifest: ${book.id} is missing a Turkish or English name`);
    if (book.chapters < 1) fail(`manifest: ${book.id} has no chapters`);
  }

  for (const meta of manifest.translations ?? []) {
    const file = path.join(ROOT, "public", meta.file);
    if (!fs.existsSync(file)) {
      fail(`missing ${path.relative(ROOT, file)}`);
      continue;
    }

    const translation = readJson(file);
    if (!translation) continue;

    const expected = EXPECTED[meta.id];
    if (!expected) fail(`unknown translation in manifest: ${meta.id}`);
    if (translation.id !== meta.id) fail(`${meta.id}: id mismatch`);
    if (translation.books?.length !== 66) fail(`${meta.id}: ${translation.books?.length} books (expected 66)`);

    let chapters = 0;
    let verses = 0;
    let notes = 0;
    let empty = 0;
    let markers = 0;
    let unbalanced = 0;
    let unsafe = 0;

    for (const book of translation.books ?? []) {
      const manifestBook = manifest.books.find((item) => item.id === book.id);
      if (!manifestBook) fail(`${meta.id}: unknown book ${book.id}`);
      else if (manifestBook.chapters !== book.chapters.length) {
        fail(`${meta.id}/${book.id}: ${book.chapters.length} chapters (manifest says ${manifestBook.chapters})`);
      }

      for (const chapter of book.chapters ?? []) {
        chapters += 1;
        if (!Array.isArray(chapter.blocks) || chapter.blocks.length === 0) {
          fail(`${meta.id}/${book.id} ${chapter.n}: empty chapter`);
          continue;
        }
        notes += chapter.notes?.length ?? 0;

        for (const block of chapter.blocks) {
          if (block.t !== "v") continue;
          verses += 1;
          if (!block.text || !block.text.trim()) empty += 1;
          if (/\\[a-z0-9]+\*?/i.test(block.text)) markers += 1;
          if (/<script|on\w+=|javascript:/i.test(block.text)) unsafe += 1;

          const opens = (block.text.match(/<span\b/g) ?? []).length;
          const closes = (block.text.match(/<\/span>/g) ?? []).length;
          if (opens !== closes) unbalanced += 1;

          const emOpen = (block.text.match(/<em>/g) ?? []).length;
          const emClose = (block.text.match(/<\/em>/g) ?? []).length;
          if (emOpen !== emClose) unbalanced += 1;
        }
      }
    }

    if (expected) {
      if (chapters !== expected.chapters) fail(`${meta.id}: ${chapters} chapters (expected ${expected.chapters})`);
      if (verses < expected.minVerses) fail(`${meta.id}: only ${verses} verses`);
    }
    if (empty > 0) fail(`${meta.id}: ${empty} empty verses`);
    if (markers > 0) fail(`${meta.id}: ${markers} verses still contain USFM markers`);
    if (unbalanced > 0) fail(`${meta.id}: ${unbalanced} verses with unbalanced tags`);
    if (unsafe > 0) fail(`${meta.id}: ${unsafe} verses contain unsafe HTML`);

    console.log(
      `✓ ${meta.id}: ${translation.books.length} books, ${chapters} chapters, ${verses} verses, ${notes} notes`,
    );
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log("\nData OK.");
