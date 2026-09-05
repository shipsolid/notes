import path from 'node:path';
import fs from 'node:fs';
import { slug as githubSlug } from 'github-slugger';

// Given a path with no (or an already-stripped) extension, find the real
// source file it refers to, trying it as a direct .md/.mdx file first and
// an index.md/mdx inside it second. Returns null if nothing backs it.
export function resolveContentFile(resolvedAbs) {
  const candidates = [
    `${resolvedAbs}.md`,
    `${resolvedAbs}.mdx`,
    path.join(resolvedAbs, 'index.md'),
    path.join(resolvedAbs, 'index.mdx'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

// Derives the site slug (extensionless, index-collapsed, posix-separated) for
// a content-collection file given its absolute path and the collection's
// absolute root. Returns null if backingFile does not live under absRoot —
// callers should leave the reference untouched in that case rather than
// emitting a slug that points outside the collection.
//
// Folds each path segment through github-slugger, matching Astro's own
// content-collection slug generation (rawSlugSegments.map(githubSlug).join)
// — without this, a segment containing uppercase (e.g. README.md) produces a
// slug that resolves fine at build time but 404s on GitHub Pages'
// case-sensitive hosting, because Astro's real page lives at the folded
// (lowercased) URL.
export function slugFromBackingFile(backingFile, absRoot) {
  const relFromRoot = path.relative(absRoot, backingFile);
  if (relFromRoot.startsWith('..')) return null;

  const folded = relFromRoot
    .replace(/\.mdx?$/i, '')
    .split(path.sep)
    .filter(Boolean)
    .map((segment) => githubSlug(segment))
    .join('/');

  return folded.replace(/(^|\/)index$/i, '');
}
