#!/usr/bin/env node
// Compares a hand-curated glossary against the corpus: for each term, is
// there a dedicated note (title match), and is it mentioned anywhere in
// body text at all? Reports; does not gate a build or auto-generate content.
//
// Usage: node scripts/notes/check-glossary-gaps.mjs [glossary-name]
// Omit the name to run every glossary under scripts/notes/glossaries/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notesRoot = path.join(__dirname, '..', '..', 'src', 'content', 'notes');
const glossariesDir = path.join(__dirname, 'glossaries');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function loadFile(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  const frontmatter = match ? (yaml.load(match[1]) || {}) : {};
  const body = match ? raw.slice(match[0].length) : raw;
  return { absPath, frontmatter, body };
}

function escapeRegExp(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordRe(term) {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
}

function checkTerm(files, { term, aliases }) {
  const names = [term, ...aliases];
  const titleHit = files.find((f) => names.some((n) => wordRe(n).test(f.frontmatter.title ?? '')));
  if (titleHit) return { term, status: 'COVERED', via: titleHit.frontmatter.title };

  const mentions = files.filter((f) => names.some((n) => wordRe(n).test(f.body)));
  if (mentions.length > 0) return { term, status: 'GAP', mentions };

  return { term, status: 'UNMENTIONED' };
}

async function loadGlossary(fileName) {
  const mod = await import(path.join(glossariesDir, fileName));
  return { name: fileName.replace(/\.mjs$/, ''), terms: mod.default };
}

const files = walk(notesRoot).map(loadFile);

const glossaryArg = process.argv[2];
const glossaryFiles = glossaryArg
  ? [`${glossaryArg}.mjs`]
  : fs.readdirSync(glossariesDir).filter((f) => f.endsWith('.mjs'));

for (const fileName of glossaryFiles) {
  const { name, terms } = await loadGlossary(fileName);
  const results = terms.map((t) => checkTerm(files, t));

  console.log(`\n${name} (${terms.length} terms)`);
  for (const status of ['GAP', 'UNMENTIONED', 'COVERED']) {
    const matches = results.filter((r) => r.status === status);
    console.log(`  ${status}: ${matches.length}`);
    if (status === 'GAP') {
      for (const m of matches) {
        console.log(`    - ${m.term}  (mentioned in ${m.mentions.length} notes, e.g. ${path.relative(notesRoot, m.mentions[0].absPath)})`);
      }
    }
    if (status === 'COVERED') {
      for (const m of matches) {
        console.log(`    - ${m.term}  (via "${m.via}")`);
      }
    }
  }
}

// Advisory tool only — "gap" is a backlog signal, not a correctness
// violation like check-ids.mjs's zettelId invariant, so this always exits 0.
