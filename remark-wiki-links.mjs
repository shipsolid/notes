import path from 'node:path';
import fs from 'node:fs';
import * as yaml from 'js-yaml';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import { slugFromBackingFile } from './note-path.mjs';

const NOTES_PREFIX = '/notes';
const WIKI_LINK_RE = /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g;
const ATX_HEADING_RE = /^#{1,6}\s+(.*?)\s*#*\s*$/;
const FENCE_RE = /^(```|~~~)/;

// [[slug]] / [[slug|Display text]] wiki-links, resolved by slug/basename —
// not by the permanent zettelId — because typing a 12-digit id to link two
// notes would kill hand-authoring. The zettelId (see note-path.mjs users in
// scripts/notes/) is the durable identity; this is the human-facing syntax.
//
// The note index and title cache are built lazily and memoized at module
// scope: astro.config.mjs registers this attacher once per build, and the
// returned transformer runs once per file, so the first file compiled pays
// for a full recursive walk of src/content/notes and every subsequent file
// reuses it.
let noteIndex = null;
const titleCache = new Map();

function buildNoteIndex(notesRoot) {
  const byFullSlug = new Map(); // lowercased full slug -> absolute path
  const byBasename = new Map(); // lowercased basename -> [{ slug, absPath }]

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.mdx?$/i.test(entry.name)) continue;

      const slug = slugFromBackingFile(full, notesRoot);
      if (slug === null) continue;

      byFullSlug.set(slug.toLowerCase(), { slug, absPath: full });

      const basename = slug.split('/').pop().toLowerCase();
      if (!byBasename.has(basename)) byBasename.set(basename, []);
      byBasename.get(basename).push({ slug, absPath: full });
    }
  }

  walk(notesRoot);
  return { byFullSlug, byBasename };
}

// Resolves a wiki-link key to { slug, absPath }, or null if unresolved, or
// 'ambiguous' if the basename matches more than one note and the key wasn't
// specific enough to disambiguate.
function resolveWikiLink(key, index) {
  const normalized = key.trim();
  const lower = normalized.toLowerCase();

  const exact = index.byFullSlug.get(lower);
  if (exact) return exact;

  const basename = lower.split('/').pop();
  const candidates = index.byBasename.get(basename) ?? [];
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) return 'ambiguous';
  return null;
}

function titleFor(absPath) {
  if (titleCache.has(absPath)) return titleCache.get(absPath);
  let title = null;
  try {
    const raw = fs.readFileSync(absPath, 'utf8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (match) {
      const data = yaml.load(match[1]) || {};
      if (typeof data.title === 'string') title = data.title;
    }
  } catch {
    // fall through to slug-derived fallback below
  }
  titleCache.set(absPath, title);
  return title;
}

// Maps a target note's heading text (lowercased) to the id Astro actually
// assigns it, so `[[note#Heading]]` produces an anchor byte-identical to
// what the rendered page uses — including github-slugger's per-file
// duplicate-heading counter, which a one-off slugify of just the linked
// heading text couldn't replicate.
const headingCache = new Map();

function headingsFor(absPath) {
  if (headingCache.has(absPath)) return headingCache.get(absPath);
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
      const match = line.match(ATX_HEADING_RE);
      if (!match) continue;
      map.set(match[1].trim().toLowerCase(), slugger.slug(match[1].trim()));
    }
  } catch {
    // leave map empty — heading fragment will fail to resolve below
  }
  headingCache.set(absPath, map);
  return map;
}

function humanize(slug) {
  return slug
    .split('/')
    .pop()
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function remarkWikiLinks() {
  return (tree, file) => {
    const filePath = file.path ? path.resolve(file.path) : null;
    if (!filePath) return;

    const cwd = file.cwd || process.cwd();
    const notesRoot = path.resolve(cwd, 'src/content/notes');
    if (!filePath.startsWith(notesRoot + path.sep)) return; // wiki-links are notes-only

    noteIndex ??= buildNoteIndex(notesRoot);

    const unresolved = [];
    const unresolvedHeadings = [];

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null || !node.value.includes('[[')) return undefined;

      WIKI_LINK_RE.lastIndex = 0;
      const matches = [...node.value.matchAll(WIKI_LINK_RE)];
      if (matches.length === 0) return undefined;

      const newNodes = [];
      let cursor = 0;

      for (const match of matches) {
        const [full, key, displayOverride] = match;
        if (match.index > cursor) {
          newNodes.push({ type: 'text', value: node.value.slice(cursor, match.index) });
        }

        const hashIndex = key.indexOf('#');
        const notePart = hashIndex === -1 ? key : key.slice(0, hashIndex);
        const headingPart = hashIndex === -1 ? null : key.slice(hashIndex + 1).trim();

        const resolved = resolveWikiLink(notePart, noteIndex);

        if (resolved && resolved !== 'ambiguous') {
          let hash = '';
          if (headingPart) {
            const id = headingsFor(resolved.absPath).get(headingPart.toLowerCase());
            if (id) {
              hash = `#${id}`;
            } else {
              unresolvedHeadings.push(`${resolved.slug}#${headingPart}`);
            }
          }

          const display = displayOverride?.trim() || titleFor(resolved.absPath) || humanize(resolved.slug);
          newNodes.push({
            type: 'link',
            url: `${NOTES_PREFIX}/${resolved.slug}/${hash}`,
            children: [{ type: 'text', value: display }],
          });

          file.data.astro ??= {};
          file.data.astro.frontmatter ??= {};
          const outbound = (file.data.astro.frontmatter.outboundLinks ??= []);
          if (!outbound.includes(resolved.slug)) outbound.push(resolved.slug);
        } else {
          unresolved.push(key.trim());
          newNodes.push({
            type: 'html',
            value: `<span class="wiki-link-unresolved" title="${
              resolved === 'ambiguous' ? 'Ambiguous note reference' : 'Unresolved note reference'
            }">${displayOverride?.trim() || key.trim()}</span>`,
          });
        }

        cursor = match.index + full.length;
      }

      if (cursor < node.value.length) {
        newNodes.push({ type: 'text', value: node.value.slice(cursor) });
      }

      parent.children.splice(index, 1, ...newNodes);
      return index + newNodes.length;
    });

    if (unresolved.length > 0) {
      const rel = path.relative(cwd, filePath);
      console.warn(`[remark-wiki-links] ${rel}: unresolved reference(s): ${unresolved.join(', ')}`);
    }
    if (unresolvedHeadings.length > 0) {
      const rel = path.relative(cwd, filePath);
      console.warn(`[remark-wiki-links] ${rel}: unresolved heading fragment(s): ${unresolvedHeadings.join(', ')}`);
    }
  };
}
