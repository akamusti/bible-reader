#!/usr/bin/env node
/**
 * Fails if tracked files look like they contain API keys, tokens, passwords or
 * private key material. Run with `npm run check` (also part of CI).
 *
 * Only locations are reported, never the matched value, so a leak is not
 * copied into CI logs or the terminal scrollback.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_BYTES = 2 * 1024 * 1024;

/** Generated Scripture, lockfiles and binaries are not credential carriers. */
const SKIP = [
  /^public\/data\//,
  /^package-lock\.json$/,
  /^src-tauri\/Cargo\.lock$/,
  /\.(png|jpe?g|gif|webp|ico|icns|woff2?|ttf|otf|zip|gz|pdf)$/i,
];

/** Tracked files that should never be committed, even if they look harmless. */
const SENSITIVE_FILES = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\.(?!example$)[^/]+$/,
  /(^|\/)\.npmrc$/,
  /(^|\/)\.netrc$/,
  /(^|\/)id_(rsa|ed25519|ecdsa|dsa)$/,
  /\.(pem|p12|pfx|key)$/i,
  /(^|\/)(credentials|service-account[^/]*)\.json$/i,
];

const PATTERNS = [
  { name: "private key block", re: /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/ },
  { name: "GitHub token", re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/ },
  { name: "OpenAI/Anthropic key", re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "Stripe key", re: /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { name: "JSON Web Token", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: "URL with credentials", re: /https?:\/\/[^/\s:@]+:[^/\s@]+@/ },
  {
    name: "hardcoded credential",
    re: /\b(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token|client[_-]?secret|secret[_-]?key|password|passwd)\b\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/i,
  },
  {
    name: "hardcoded credential",
    re: /\b(?:API[_-]?KEY|ACCESS[_-]?TOKEN|AUTH[_-]?TOKEN|CLIENT[_-]?SECRET|SECRET[_-]?KEY|PASSWORD)\b\s*=\s*([^\s#'"]{8,})/,
  },
];

/** Values that are obviously references or placeholders, not secrets. */
function isPlaceholder(value) {
  return (
    /^(?:x+|\*+|\.{3}|-+)$/i.test(value) ||
    /^[<${].*[>}]$/.test(value) ||
    /^(?:process\.env|import\.meta\.env|os\.environ|env|secrets)\./.test(value) ||
    /^(?:your|example|sample|placeholder|change[_-]?me|redacted|todo|test|dummy|fake)[-_ .]/i.test(value)
  );
}

function trackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" });
  return output.split("\0").filter(Boolean);
}

function readText(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.length > MAX_BYTES || buffer.includes(0)) return null;
  return buffer.toString("utf8");
}

const problems = [];
const files = trackedFiles();

for (const relative of files) {
  if (SKIP.some((re) => re.test(relative))) continue;

  if (SENSITIVE_FILES.some((re) => re.test(relative))) {
    problems.push(`${relative}: sensitive file should not be committed`);
    continue;
  }

  const text = readText(path.join(ROOT, relative));
  if (text === null) continue;

  text.split(/\r?\n/).forEach((line, index) => {
    for (const { name, re } of PATTERNS) {
      const match = re.exec(line);
      if (!match) continue;
      const value = match[1];
      if (value && isPlaceholder(value)) continue;
      problems.push(`${relative}:${index + 1}: possible ${name}`);
    }
  });
}

if (problems.length > 0) {
  console.error("Secret scan failed:");
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error("\nRemove the value, use an environment variable, or rotate the key.");
  process.exit(1);
}

console.log(`✓ secret scan: ${files.length} tracked files, no credentials found`);
