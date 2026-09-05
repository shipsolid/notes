#!/usr/bin/env node
// Finds notes that are mentioned as plain text elsewhere in the corpus but
// never [[wikilinked]] to — a prioritization aid for backfilling the notes
// graph, not a correctness check (see check-links.mjs for that).
//
// check-glossary-gaps.mjs is the closest existing tool but only checks a
// small hand-curated glossary. This generalizes it corpus-wide, but can't
// just match on raw frontmatter `title` — titles carry a chapter-numbering
// prefix ("2 — OTLP Protocol"), not the bare term someone would actually
// type in prose ("OTLP"). So each note contributes up to two candidate
// terms instead:
//   1. its basename as a phrase (e.g. "otlp-protocol" -> "otlp protocol")
//   2. any ALL-CAPS acronym-looking substrings in its title (e.g. "OTLP")
// A handful of generic basenames (readme, overview, index, ...) are
// stoplisted — otherwise near-every stub chapter's boilerplate title would
// show up as a "term," which is noise, not signal. A term matching more than
// one note is skipped entirely as ambiguous, same as resolveWikiLink does
// for basename collisions.
//
// This is a heuristic, not a proof: false positives (a term that happens to
// overlap unrelated prose) and false negatives (real mentions phrased
// differently than the note's basename/title) are both possible. Treat the
// output as a ranked worklist for a human, not an auto-apply list.
//
// Usage: node scripts/notes/check-link-candidates.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { slugFromBackingFile } from '../../note-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const notesRoot = path.join(projectRoot, 'src', 'content', 'notes');

const WIKI_LINK_RE = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;

const GENERIC_BASENAMES = new Set([
  'readme',
  'overview',
  'introduction',
  'index',
  'summary',
  'purpose',
  'appendix',
  'appendices',
  'notes',
  'example',
  'examples',
  'exercise',
  'exercises',
  'quiz',
  'glossary',
  'references',
  'reference',
  'faq',
]);

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
  const match = raw.match(FRONTMATTER_RE);
  const frontmatter = match ? yaml.load(match[1]) || {} : {};
  const body = match ? raw.slice(match[0].length) : raw;
  return { absPath, rel: path.relative(notesRoot, absPath), frontmatter, body };
}

function escapeRegExp(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const files = walk(notesRoot).map(loadFile);

// ---- shared slug index — mirrors check-links.mjs's, which itself mirrors
// remark-wiki-links.mjs's module-private buildNoteIndex. Duplicated a third
// time deliberately rather than extracting a shared module out of either
// build-critical file, to keep this advisory script zero-risk to the build.
const byFullSlug = new Map();
const byBasename = new Map();
for (const f of files) {
  const slug = slugFromBackingFile(f.absPath, notesRoot);
  if (slug === null) continue;
  f.slug = slug;
  byFullSlug.set(slug.toLowerCase(), { slug, absPath: f.absPath });
  const basename = slug.split('/').pop().toLowerCase();
  if (!byBasename.has(basename)) byBasename.set(basename, []);
  byBasename.get(basename).push({ slug, absPath: f.absPath });
}

function resolveWikiLink(key) {
  const lower = key.trim().toLowerCase();
  const exact = byFullSlug.get(lower);
  if (exact) return exact;
  const basename = lower.split('/').pop();
  const candidates = byBasename.get(basename) ?? [];
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) return { ambiguous: true };
  return null;
}

// ---- candidate term extraction ----
// term (lowercased) -> [{ slug, title }] ; length > 1 means ambiguous, skipped later
const termIndex = new Map();

function addTerm(term, slug, title) {
  const key = term.toLowerCase();
  if (!termIndex.has(key)) termIndex.set(key, []);
  const list = termIndex.get(key);
  if (!list.some((e) => e.slug === slug)) list.push({ slug, title });
}

for (const f of files) {
  if (!f.slug) continue;
  const basename = f.slug.split('/').pop();
  // Single-word basenames ("design", "build", "stack", "logs", ...) are
  // almost always common English/technical vocabulary that shows up
  // constantly across an engineering corpus regardless of topic — only a
  // multi-word compound (has a hyphen) is distinctive enough to be a useful
  // signal here (confirmed empirically: an early single-word-inclusive pass
  // flagged "design" in 471 files).
  if (!GENERIC_BASENAMES.has(basename) && basename.includes('-')) {
    addTerm(basename.split('-').join(' '), f.slug, f.frontmatter.title ?? basename);
  }
  const title = typeof f.frontmatter.title === 'string' ? f.frontmatter.title : '';
  // 4+ letters only — 2-3 letter "acronyms" pulled from a title (e.g. "VS",
  // "USE" used as emphasis, not as an acronym) are almost always ordinary
  // words in disguise and flood the match set (confirmed: "VS" alone hit 226
  // files, "USE" hit 252).
  for (const m of title.matchAll(/\b[A-Z]{4,6}\b/g)) {
    addTerm(m[0], f.slug, f.frontmatter.title);
  }
}

// Drop ambiguous terms (matched more than one note) entirely — not
// confident enough to suggest.
const unambiguousTerms = [...termIndex.entries()].filter(([, owners]) => owners.length === 1);

// Single alternation regex, longest term first so multi-word phrases win
// over any shorter term that happens to be a substring of one.
const sortedTerms = unambiguousTerms.map(([term]) => term).sort((a, b) => b.length - a.length);
const bigRe = new RegExp(`\\b(${sortedTerms.map(escapeRegExp).join('|')})\\b`, 'gi');
const termOwner = new Map(unambiguousTerms.map(([term, owners]) => [term, owners[0]]));

// ---- scan every file's body for unlinked mentions ----
const findings = new Map(); // target slug -> { title, sources: Set<rel> }

for (const f of files) {
  if (!f.slug) continue;

  const linkedSlugs = new Set();
  WIKI_LINK_RE.lastIndex = 0;
  for (const m of f.body.matchAll(WIKI_LINK_RE)) {
    const notePart = m[1].split('#')[0];
    const resolved = resolveWikiLink(notePart);
    if (resolved && !resolved.ambiguous) linkedSlugs.add(resolved.slug);
  }

  bigRe.lastIndex = 0;
  for (const m of f.body.matchAll(bigRe)) {
    const owner = termOwner.get(m[0].toLowerCase());
    if (!owner || owner.slug === f.slug || linkedSlugs.has(owner.slug)) continue;
    if (!findings.has(owner.slug)) findings.set(owner.slug, { title: owner.title, sources: new Set() });
    findings.get(owner.slug).sources.add(f.rel);
  }
}

// ---- report ----
const ranked = [...findings.entries()].sort((a, b) => b[1].sources.size - a[1].sources.size);

console.log(`${files.length} notes scanned, ${sortedTerms.length} candidate term(s), ${ranked.length} note(s) with unlinked mentions.\n`);

for (const [slug, { title, sources }] of ranked) {
  console.log(`${title}  [[${slug.split('/').pop()}]]  (${sources.size} file${sources.size === 1 ? '' : 's'})`);
  const sample = [...sources].slice(0, 5);
  for (const s of sample) console.log(`  - ${s}`);
  if (sources.size > sample.length) console.log(`  ... and ${sources.size - sample.length} more`);
}

// Advisory tool only — a ranked worklist for a human, not a correctness
// gate like check-links.mjs — always exits 0.
