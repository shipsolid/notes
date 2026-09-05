#!/usr/bin/env node
// Converts relative markdown links (`](../foo/bar.md)`) in the notes corpus
// into [[wikilinks]], so moving a note stops breaking every link that points
// at it. Relative links resolve against the *linking file's* on-disk path
// (remark-rewrite-md-links.mjs) and silently 404 on a move; wikilinks resolve
// against a corpus-wide slug/basename index (remark-wiki-links.mjs) and
// survive a move as long as the target's basename stays unique.
//
// Mirrors check-links.mjs's resolution machinery (byFullSlug/byBasename
// index, resolveContentFile/slugFromBackingFile, isSkippable) so "would this
// link resolve" here matches production exactly. Parses each file's body
// with remark but never restringifies the tree — restringifying would
// reformat the whole corpus (list markers, wrapping, ...). Instead each
// converted `link` node's position.start/end.offset is used to splice
// replacement text directly into the original raw string, leaving everything
// else byte-identical.
//
// Explicitly out of scope:
//   - reference-style links (`[text][ref]` + `[ref]: url` definitions) — a
//     different mdast node type (linkReference), left untouched.
//   - renaming files to dedupe colliding basenames — links whose target's
//     basename collides with another note use the full slug as the wikilink
//     key instead; no filenames change.
//
// Usage:
//   node scripts/notes/migrate-md-links-to-wikilinks.mjs            # dry run
//   node scripts/notes/migrate-md-links-to-wikilinks.mjs --apply    # rewrite
//   node scripts/notes/migrate-md-links-to-wikilinks.mjs --apply --verbose
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import { resolveContentFile, slugFromBackingFile } from '../../note-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const notesRoot = path.join(projectRoot, 'src', 'content', 'notes');

const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');

const ATX_HEADING_RE = /^#{1,6}\s+(.*?)\s*#*\s*$/;
const FENCE_RE = /^(```|~~~)/;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;

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
  const frontmatterRaw = match ? match[0] : '';
  const body = match ? raw.slice(match[0].length) : raw;
  return { absPath, rel: path.relative(notesRoot, absPath), frontmatterRaw, body };
}

// Mirrors remark-rewrite-md-links.mjs's isSkippable exactly.
function isSkippable(url) {
  return (
    !url ||
    url.startsWith('#') ||
    url.startsWith('/') ||
    url.startsWith('mailto:') ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
  );
}

const files = walk(notesRoot).map(loadFile);

// ---- shared slug index — mirrors check-links.mjs's, which itself mirrors
// remark-wiki-links.mjs's module-private buildNoteIndex.
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

// Inverts headingsFor() from remark-wiki-links.mjs/check-links.mjs: instead
// of raw-heading-text -> slugger-id, this maps slugger-id -> raw-heading-text
// so an existing slug-style #hash can be re-expressed as the heading text a
// [[wikilink#Heading]] needs (remark-wiki-links.mjs re-slugs that text itself
// to produce the final anchor id).
const headingReverseCache = new Map();
function headingReverseFor(absPath) {
  if (headingReverseCache.has(absPath)) return headingReverseCache.get(absPath);
  const map = new Map();
  try {
    const raw = fs.readFileSync(absPath, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
    const slugger = new GithubSlugger();
    let inFence = false;
    for (const line of raw.split(/\r?\n/)) {
      if (FENCE_RE.test(line.trim())) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      const m = line.match(ATX_HEADING_RE);
      if (!m) continue;
      const text = m[1].trim();
      map.set(slugger.slug(text), text);
    }
  } catch {
    // leave map empty — caller treats a missing id as unmappable
  }
  headingReverseCache.set(absPath, map);
  return map;
}

// Flattens a link node's children to plain text for the wikilink's |display
// override — markdown formatting (bold/code/italic) inside a link label
// can't survive as wikilink display text, which is a plain string.
function plainText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  if (node.children) return node.children.map(plainText).join('');
  return '';
}

function hasFormatting(node) {
  if (!node.children) return false;
  return node.children.some((c) => c.type !== 'text' || hasFormatting(c));
}

const stats = {
  convertedBasename: 0,
  convertedFullSlug: 0,
  convertedWithHeading: 0,
  formattingFlattened: [],
  skippedEscapesCollection: [],
  skippedUnresolvable: [],
  skippedHeadingUnmappable: [],
  skippedUnsafeLabel: [],
};

let filesChanged = 0;

for (const f of files) {
  const tree = unified().use(remarkParse).parse(f.body);
  const fileDir = path.dirname(f.absPath);
  const replacements = [];

  visit(tree, 'link', (node) => {
    if (isSkippable(node.url)) return;
    const line = node.position?.start.line ?? 0;
    const loc = `${f.rel}:${line}`;

    const [urlPath, hash] = node.url.split('#');
    const resolvedAbs = path.resolve(fileDir, urlPath);
    const backingFile = /\.mdx?$/i.test(urlPath)
      ? (fs.existsSync(resolvedAbs) ? resolvedAbs : null)
      : resolveContentFile(resolvedAbs);
    if (!backingFile) {
      stats.skippedUnresolvable.push(`${loc}  -> ${node.url}`);
      return;
    }

    const slug = slugFromBackingFile(backingFile, notesRoot);
    if (slug === null) {
      stats.skippedEscapesCollection.push(`${loc}  -> ${node.url}`);
      return;
    }

    const basename = slug.split('/').pop().toLowerCase();
    const candidates = byBasename.get(basename) ?? [];
    const key = candidates.length === 1 ? slug.split('/').pop() : slug;

    let headingPart = null;
    if (hash) {
      const text = headingReverseFor(backingFile).get(hash.toLowerCase());
      if (!text) {
        stats.skippedHeadingUnmappable.push(`${loc}  -> ${node.url}`);
        return;
      }
      // remark-wiki-links.mjs matches a wikilink's #heading text against a
      // map built from the target's *raw on-disk* heading text, but the
      // heading text it matches *with* has already passed through Astro's
      // default remark-smartypants pass (straight quotes/hyphens -> curly
      // quotes/en-dash) by the time remarkWikiLinks sees it. A heading whose
      // raw text contains smartypants-sensitive punctuation therefore can
      // never match through a wikilink anchor, even though it matches here
      // (this check reads raw text, same as headingsFor does) — confirmed by
      // a real `astro build` producing two "unresolved heading fragment"
      // warnings for exactly this case during migration. Leave those as the
      // original relative link, which passes the hash straight through
      // un-normalized and so still works.
      if (/["']|--|\.\.\./.test(text)) {
        stats.skippedHeadingUnmappable.push(`${loc}  -> ${node.url}  (smartypants-sensitive heading text)`);
        return;
      }
      headingPart = text;
    }

    const label = plainText(node).trim();
    if (!label || label.includes('[[') || label.includes(']]')) {
      stats.skippedUnsafeLabel.push(`${loc}  -> ${node.url}  (label: ${JSON.stringify(label)})`);
      return;
    }
    if (hasFormatting(node)) stats.formattingFlattened.push(`${loc}  -> ${node.url}`);

    const wikiKey = headingPart ? `${key}#${headingPart}` : key;
    const replacement = `[[${wikiKey}|${label}]]`;

    replacements.push({ start: node.position.start.offset, end: node.position.end.offset, replacement });

    if (headingPart) stats.convertedWithHeading++;
    else if (key === slug) stats.convertedFullSlug++;
    else stats.convertedBasename++;
  });

  if (replacements.length === 0) continue;
  filesChanged++;

  if (APPLY) {
    replacements.sort((a, b) => b.start - a.start);
    let body = f.body;
    for (const { start, end, replacement } of replacements) {
      body = body.slice(0, start) + replacement + body.slice(end);
    }
    fs.writeFileSync(f.absPath, f.frontmatterRaw + body);
  }
}

// ---- report ----
function section(title, items) {
  console.log(`\n${title} (${items.length})`);
  if (!VERBOSE && items.length > 20) {
    for (const item of items.slice(0, 20)) console.log(`  ${item}`);
    console.log(`  ... and ${items.length - 20} more (--verbose to see all)`);
  } else {
    for (const item of items) console.log(`  ${item}`);
  }
}

console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — ${files.length} notes scanned, ${filesChanged} file(s) with at least one convertible link.`);
console.log(`\nConverted: ${stats.convertedBasename + stats.convertedFullSlug + stats.convertedWithHeading}`);
console.log(`  bare basename key:      ${stats.convertedBasename}`);
console.log(`  full slug key (collision): ${stats.convertedFullSlug}`);
console.log(`  with heading anchor:    ${stats.convertedWithHeading}`);

section('Formatting flattened to plain text (review these)', stats.formattingFlattened);
section('Skipped — heading anchor could not be reverse-mapped', stats.skippedHeadingUnmappable);
section('Skipped — unsafe/empty label', stats.skippedUnsafeLabel);
section('Skipped — escapes notes collection', stats.skippedEscapesCollection);
section('Skipped — unresolvable (pre-existing broken link)', stats.skippedUnresolvable);

if (!APPLY) {
  console.log('\nDry run only — no files written. Re-run with --apply to write changes.');
}
