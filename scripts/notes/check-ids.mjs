#!/usr/bin/env node
// Sanity check for the Zettelkasten-lite invariant: every note has a
// zettelId, and no two notes share one. Exits non-zero on failure so it can
// gate a build (e.g. `node scripts/notes/check-ids.mjs && npm run build`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notesRoot = path.join(__dirname, '..', '..', 'src', 'content', 'notes');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function frontmatter(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  return match ? (yaml.load(match[1]) || {}) : {};
}

const files = walk(notesRoot);
const byId = new Map();
const missing = [];

for (const absPath of files) {
  const { zettelId } = frontmatter(absPath);
  const rel = path.relative(notesRoot, absPath);
  if (!zettelId) {
    missing.push(rel);
    continue;
  }
  const id = String(zettelId);
  if (!byId.has(id)) byId.set(id, []);
  byId.get(id).push(rel);
}

const duplicates = [...byId.entries()].filter(([, paths]) => paths.length > 1);

let ok = true;
if (missing.length > 0) {
  ok = false;
  console.error(`Missing zettelId (${missing.length}):`);
  for (const rel of missing) console.error(`  ${rel}`);
}
if (duplicates.length > 0) {
  ok = false;
  console.error(`Duplicate zettelId (${duplicates.length}):`);
  for (const [id, paths] of duplicates) {
    console.error(`  ${id}:`);
    for (const rel of paths) console.error(`    ${rel}`);
  }
}

if (ok) {
  console.log(`OK — ${files.length} notes, all zettelIds present and unique.`);
  process.exit(0);
} else {
  process.exit(1);
}
