// Core of the broken-link audit for the notes content collection. Cross-checks
// all three link mechanisms the corpus uses — GitHub-style relative markdown
// links, [[wikilinks]], and the `relations` frontmatter field — against the
// real resolution rules the Astro build applies via remark-rewrite-md-links.mjs,
// remark-wiki-links.mjs, and notes-graph.ts. None of those three paths fails
// the build (or, for markdown links and relations, even warns) when a target
// doesn't exist, so this is the only place that surfaces them.
//
// Exposed as `runLinkCheck()` so both the CLI (check-links.mjs) and the
// build-time notes/link-health page can share one source of truth.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import { resolveContentFile, slugFromBackingFile } from '../../note-path.mjs';

// Climbs from `startDir` to the nearest ancestor containing astro.config.mjs.
// Plain `path.join(__dirname, '..', '..')` broke when this module is imported
// from an Astro page: Astro's build bundles page frontmatter with Rollup,
// which physically relocates this file's code (and its import.meta.url) under
// dist/, so a fixed relative offset from __dirname no longer lands on the
// project root. Walking up to a stable marker works from any depth, since
// dist/ is always nested inside the project root either way.
function findProjectRoot(startDir) {
  let dir = startDir;
  while (!fs.existsSync(path.join(dir, 'astro.config.mjs'))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`Could not locate project root (astro.config.mjs) above ${startDir}`);
    dir = parent;
  }
  return dir;
}

export function runLinkCheck() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = findProjectRoot(__dirname);
  const notesRoot = path.join(projectRoot, 'src', 'content', 'notes');

  const WIKI_LINK_RE = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;
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
    const frontmatter = match ? yaml.load(match[1]) || {} : {};
    const frontmatterLines = match ? match[0].split(/\r?\n/).length - 1 : 0;
    const body = match ? raw.slice(match[0].length) : raw;
    return {
      absPath,
      rel: path.relative(notesRoot, absPath),
      frontmatter,
      frontmatterLines,
      frontmatterRaw: match ? match[1] : '',
      body,
    };
  }

  const files = walk(notesRoot).map(loadFile);

  // ---- shared slug index — mirrors remark-wiki-links.mjs's buildNoteIndex,
  // which isn't exported (it's a module-private helper). Duplicated here since
  // it's pure data-structure construction with no branching logic to drift.
  const byFullSlug = new Map();
  const byBasename = new Map();
  const canonicalSlug = new Map(); // lowercased full slug -> real-cased slug
  for (const f of files) {
    const slug = slugFromBackingFile(f.absPath, notesRoot);
    if (slug === null) continue;
    f.slug = slug;
    byFullSlug.set(slug.toLowerCase(), { slug, absPath: f.absPath });
    canonicalSlug.set(slug.toLowerCase(), slug);
    const basename = slug.split('/').pop().toLowerCase();
    if (!byBasename.has(basename)) byBasename.set(basename, []);
    byBasename.get(basename).push({ slug, absPath: f.absPath });
  }

  // Mirrors remark-wiki-links.mjs's resolveWikiLink exactly (also module-private).
  function resolveWikiLink(key) {
    const lower = key.trim().toLowerCase();
    const exact = byFullSlug.get(lower);
    if (exact) return exact;
    const basename = lower.split('/').pop();
    const candidates = byBasename.get(basename) ?? [];
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) return { ambiguous: candidates };
    return null;
  }

  // Mirrors remark-wiki-links.mjs's headingsFor exactly (also module-private).
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
        const m = line.match(ATX_HEADING_RE);
        if (!m) continue;
        map.set(m[1].trim().toLowerCase(), slugger.slug(m[1].trim()));
      }
    } catch {
      // leave map empty — heading fragment will be reported as broken below
    }
    headingCache.set(absPath, map);
    return map;
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

  // Astro's actual content-collection slug (node_modules/astro/dist/content/utils.js):
  // per-path-segment github-slugger fold, joined. slugFromBackingFile does not
  // fold case, so any segment containing uppercase (only README.md in this
  // corpus today) produces an href that mismatches the real deployed page.
  const caseSlugger = new GithubSlugger();
  function githubSlugSegment(segment) {
    caseSlugger.reset();
    return caseSlugger.slug(segment);
  }

  const brokenMdLinks = [];
  const escapedLinks = [];
  const brokenDirectFileLinks = [];
  const readmeCaseMismatches = [];
  const unresolvedWikiLinks = [];
  const ambiguousWikiLinks = [];
  const brokenAnchors = [];
  const brokenRelations = [];

  function checkResolvedContentLink(f, line, rawTarget, backingFile) {
    const slug = slugFromBackingFile(backingFile, notesRoot);
    if (slug === null) {
      escapedLinks.push({
        file: f.rel,
        line,
        target: rawTarget,
        backingFile: path.relative(projectRoot, backingFile),
        sourceSlug: f.slug,
      });
      return;
    }
    // Independently re-derive Astro's real (case-folded) slug from the backing
    // file's on-disk path, and compare against what slugFromBackingFile
    // produced — a divergence means slugFromBackingFile drifted from Astro's
    // own content-collection slug logic again.
    const rawSegs = path.relative(notesRoot, backingFile).replace(/\.mdx?$/i, '').split(path.sep).filter(Boolean);
    const expectedSlug = rawSegs.map(githubSlugSegment).join('/').replace(/\/index$/i, '');
    if (slug !== expectedSlug) {
      readmeCaseMismatches.push({
        file: f.rel,
        line,
        target: rawTarget,
        rewrittenHref: `/notes/${slug}/`,
        actualHref: `/notes/${expectedSlug}/`,
        sourceSlug: f.slug,
      });
    }
  }

  for (const f of files) {
    const tree = unified().use(remarkParse).parse(f.body);
    const fileDir = path.dirname(f.absPath);

    // ---- markdown links ----
    visit(tree, 'link', (node) => {
      if (isSkippable(node.url)) return;
      const line = f.frontmatterLines + (node.position?.start.line ?? 0);
      const [urlPath, hash] = node.url.split('#');
      const resolvedAbs = path.resolve(fileDir, urlPath);
      const ext = path.extname(urlPath.split('?')[0]);

      if (/\.mdx?$/i.test(ext)) {
        // GitHub-style content link — production checks this path directly,
        // no index.md fallback.
        if (!fs.existsSync(resolvedAbs)) {
          brokenMdLinks.push({ file: f.rel, line, target: node.url, sourceSlug: f.slug });
          return;
        }
        checkResolvedContentLink(f, line, node.url, resolvedAbs);
        return;
      }

      if (ext === '') {
        // Extensionless — could be a hand-authored slug-style link or a plain
        // directory reference. production falls back to resolveContentFile.
        const backingFile = resolveContentFile(resolvedAbs);
        if (!backingFile) {
          brokenMdLinks.push({ file: f.rel, line, target: node.url, sourceSlug: f.slug });
          return;
        }
        checkResolvedContentLink(f, line, node.url, backingFile);
        return;
      }

      // Any other extension (.yml, .py, .sh, ...) is a direct reference to a
      // non-collection file, out of scope for content-link resolution — but
      // still worth flagging if the literal target doesn't exist on disk.
      if (!fs.existsSync(resolvedAbs)) {
        brokenDirectFileLinks.push({ file: f.rel, line, target: node.url, sourceSlug: f.slug });
      }
    });

    // ---- wikilinks ----
    visit(tree, 'text', (node) => {
      if (!node.value.includes('[[')) return;
      WIKI_LINK_RE.lastIndex = 0;
      for (const m of node.value.matchAll(WIKI_LINK_RE)) {
        const key = m[1];
        const hashIndex = key.indexOf('#');
        const notePart = hashIndex === -1 ? key : key.slice(0, hashIndex);
        const headingPart = hashIndex === -1 ? null : key.slice(hashIndex + 1).trim();
        const nodeStartLine = node.position?.start.line ?? 1;
        const extraLines = node.value.slice(0, m.index).split('\n').length - 1;
        const line = f.frontmatterLines + nodeStartLine + extraLines;

        const resolved = resolveWikiLink(notePart);
        if (resolved === null) {
          unresolvedWikiLinks.push({ file: f.rel, line, target: key.trim(), sourceSlug: f.slug });
        } else if (resolved.ambiguous) {
          ambiguousWikiLinks.push({
            file: f.rel,
            line,
            target: key.trim(),
            candidates: resolved.ambiguous.map((c) => c.slug),
            sourceSlug: f.slug,
          });
        } else if (headingPart) {
          const ids = headingsFor(resolved.absPath);
          if (!ids.get(headingPart.toLowerCase())) {
            brokenAnchors.push({ file: f.rel, line, target: key.trim(), noteSlug: resolved.slug, sourceSlug: f.slug });
          }
        }
      }
    });

    // ---- relations frontmatter ----
    const relations = f.frontmatter.relations ?? [];
    relations.forEach((rel) => {
      const canon = canonicalSlug.get(String(rel.slug).toLowerCase());
      if (canon) return;
      let line = 1;
      const idxInBlock = f.frontmatterRaw.indexOf(String(rel.slug));
      if (idxInBlock !== -1) line = 1 + f.frontmatterRaw.slice(0, idxInBlock).split('\n').length;
      brokenRelations.push({ file: f.rel, line, target: rel.slug, kind: rel.kind, sourceSlug: f.slug });
    });
  }

  return {
    files,
    brokenMdLinks,
    escapedLinks,
    brokenDirectFileLinks,
    readmeCaseMismatches,
    unresolvedWikiLinks,
    ambiguousWikiLinks,
    brokenAnchors,
    brokenRelations,
  };
}
