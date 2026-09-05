#!/usr/bin/env node
// Broken-link audit for the notes content collection. See link-check-core.mjs
// for what this checks and why — this file is just the CLI report + exit-code
// wrapper around it. Gates on any finding (non-zero exit) — see
// scripts/notes/check-ids.mjs, the sibling script this one follows the shape of.
//
// Usage: node scripts/notes/check-links.mjs
import { runLinkCheck } from './link-check-core.mjs';

const {
  brokenMdLinks,
  escapedLinks,
  brokenDirectFileLinks,
  readmeCaseMismatches,
  unresolvedWikiLinks,
  ambiguousWikiLinks,
  brokenAnchors,
  brokenRelations,
  files,
} = runLinkCheck();

// ---- report ----
function section(title, items, render) {
  console.log(`\n${title} (${items.length})`);
  for (const item of items) console.log(`  ${render(item)}`);
}

section('Broken markdown links (dead)', brokenMdLinks, (i) => `${i.file}:${i.line}  -> ${i.target}`);
section(
  'Markdown links escaping the collection',
  escapedLinks,
  (i) => `${i.file}:${i.line}  -> ${i.target}  (resolves to ${i.backingFile}, outside src/content/notes)`,
);
section(
  'Broken direct file references (non-.md links)',
  brokenDirectFileLinks,
  (i) => `${i.file}:${i.line}  -> ${i.target}`,
);
section(
  'README case-fold mismatches (resolved, but will 404 on deploy)',
  readmeCaseMismatches,
  (i) => `${i.file}:${i.line}  -> ${i.target}  (rewritten href ${i.rewrittenHref}, real page is ${i.actualHref})`,
);
section('Unresolved wikilinks', unresolvedWikiLinks, (i) => `${i.file}:${i.line}  [[${i.target}]]`);
section(
  'Ambiguous wikilinks',
  ambiguousWikiLinks,
  (i) => `${i.file}:${i.line}  [[${i.target}]]  could mean: ${i.candidates.join(', ')}`,
);
section(
  'Broken heading anchors (note resolves, #heading does not)',
  brokenAnchors,
  (i) => `${i.file}:${i.line}  [[${i.target}]]  (note: ${i.noteSlug})`,
);
section('Broken relations', brokenRelations, (i) => `${i.file}:${i.line}  relations -> ${i.target} (${i.kind})`);

const total =
  brokenMdLinks.length +
  escapedLinks.length +
  brokenDirectFileLinks.length +
  readmeCaseMismatches.length +
  unresolvedWikiLinks.length +
  ambiguousWikiLinks.length +
  brokenAnchors.length +
  brokenRelations.length;

console.log(`\n${files.length} notes scanned, ${total} finding(s).`);
process.exit(total > 0 ? 1 : 0);
