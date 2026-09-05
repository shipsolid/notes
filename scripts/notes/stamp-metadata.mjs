#!/usr/bin/env node
// One-time (but idempotent) migration: stamps every note in
// src/content/notes with a permanent `zettelId` and, where the file looks
// like a hub/index doc, `noteType: moc`. Safe to re-run — only fills in
// fields that are still missing, so it also works as the "assign an id to
// this new note" tool going forward.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const astroRoot = path.resolve(__dirname, '..', '..');
const notesRoot = path.join(astroRoot, 'src', 'content', 'notes');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/i.test(entry.name)) out.push(full);
  }
  return out;
}

// Matches the frontmatter block, keeping the trailing newline (or EOF)
// after the closing fence separate so new lines can be spliced in just
// before it without disturbing anything else in the file byte-for-byte.
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;

function readFrontmatter(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { raw, match: null, data: {} };
  const data = yaml.load(match[1]) || {};
  return { raw, match, data };
}

function gitCreationTimestamp(absPath) {
  const rel = path.relative(astroRoot, absPath);
  try {
    const out = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--follow', '--format=%ad', '--date=format:%Y%m%d%H%M', '--', rel],
      { cwd: astroRoot, encoding: 'utf8' },
    ).trim();
    const lines = out.split('\n').filter(Boolean);
    return lines.length > 0 ? lines[lines.length - 1] : null;
  } catch {
    return null;
  }
}

function isMoc(absPath) {
  if (/^readme\.mdx?$/i.test(path.basename(absPath))) return true;
  const sibling = absPath.replace(/\.mdx?$/i, '');
  return fs.existsSync(sibling) && fs.statSync(sibling).isDirectory();
}

const files = walk(notesRoot).sort((a, b) => a.localeCompare(b));

// Pass 1: whatever zettelIds already exist (partial prior run) are off-limits.
const taken = new Set();
const parsed = files.map((absPath) => {
  const { raw, match, data } = readFrontmatter(absPath);
  if (data.zettelId) taken.add(String(data.zettelId));
  return { absPath, raw, match, data };
});

// Pass 2: assign missing zettelIds deterministically (sorted by path above),
// so collisions within one git commit resolve to stable -2, -3, ... suffixes.
for (const file of parsed) {
  if (file.data.zettelId) continue;
  const base = gitCreationTimestamp(file.absPath)
    ?? new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  taken.add(candidate);
  file.newZettelId = candidate;
}

// Pass 3: write. Only append the lines that are actually missing.
let stampedIds = 0;
let stampedMocs = 0;
let skippedNoFrontmatter = 0;
for (const file of parsed) {
  const needsType = !file.data.noteType && isMoc(file.absPath);
  if (!file.newZettelId && !needsType) continue;

  if (!file.match) {
    skippedNoFrontmatter += 1;
    console.warn(`skip (no frontmatter block): ${path.relative(astroRoot, file.absPath)}`);
    continue;
  }

  const lines = [];
  if (file.newZettelId) { lines.push(`zettelId: "${file.newZettelId}"`); stampedIds += 1; }
  if (needsType) { lines.push('noteType: moc'); stampedMocs += 1; }

  const [fullMatch, inner, trailing] = file.match;
  const newBlock = `---\n${inner}\n${lines.join('\n')}\n---${trailing}`;
  const newRaw = newBlock + file.raw.slice(fullMatch.length);
  fs.writeFileSync(file.absPath, newRaw);
}

console.log(`notes scanned: ${files.length}`);
console.log(`zettelId stamped: ${stampedIds}`);
console.log(`noteType: moc stamped: ${stampedMocs}`);
if (skippedNoFrontmatter) console.log(`skipped (no frontmatter): ${skippedNoFrontmatter}`);

// Non-zero exit when files were actually modified — lets pre-commit (and any
// other fixer-hook caller) treat this the same as `prettier --write`: block
// the commit, show the diff, require a re-stage.
process.exit(stampedIds + stampedMocs > 0 ? 1 : 0);
