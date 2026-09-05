import path from 'node:path';
import fs from 'node:fs';
import { visit } from 'unist-util-visit';
import { resolveContentFile, slugFromBackingFile } from './note-path.mjs';

// Content collections whose entries render at `<prefix>/<slug>/`, where slug
// is the file path relative to `root`, extension stripped (Astro's default
// content-collection slug). Order matters only in that a file must live
// under exactly one of these roots.
const COLLECTIONS = [
  { root: 'src/content/notes', prefix: '/notes' },
  { root: 'src/content/blog', prefix: '/blog' },
  { root: 'src/content/projects', prefix: '/projects' },
];

function isSkippable(url) {
  return (
    !url ||
    url.startsWith('#') ||
    url.startsWith('/') ||
    url.startsWith('mailto:') ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(url) // any scheme, e.g. https://, mailto:// etc.
  );
}

// Rewrites relative links to sibling content-collection files — whether
// written GitHub-style with a `.md`/`.mdx` suffix, or already hand-edited
// into an extensionless, trailing-slash form aimed at the site's rendered
// URL — into the site's actual URL for that entry. Astro's markdown
// pipeline otherwise emits these hrefs byte-for-byte, but the built site
// serves collection entries at extensionless, slug-based routes: a link
// resolved against the *source file's* on-disk location (the natural way
// to write it, and how GitHub renders it) does not equal a link resolved
// against the *rendered page's* URL, because every entry becomes its own
// directory (`<slug>/index.html`). Resolving on disk and re-deriving the
// slug sidesteps that mismatch entirely, for either link style.
export function remarkRewriteMdLinks() {
  return (tree, file) => {
    const filePath = file.path ? path.resolve(file.path) : null;
    if (!filePath) return;

    const cwd = file.cwd || process.cwd();
    const collection = COLLECTIONS.map(({ root, prefix }) => ({
      absRoot: path.resolve(cwd, root),
      prefix,
    })).find(({ absRoot }) => filePath.startsWith(absRoot + path.sep));
    if (!collection) return;

    const fileDir = path.dirname(filePath);

    visit(tree, 'link', (node) => {
      if (isSkippable(node.url)) return;

      const [urlPath, hash] = node.url.split('#');
      const resolvedAbs = path.resolve(fileDir, urlPath);

      const backingFile = /\.mdx?$/i.test(urlPath)
        ? (fs.existsSync(resolvedAbs) ? resolvedAbs : null)
        : resolveContentFile(resolvedAbs);
      if (!backingFile) return; // not a link to a real content file — leave as-is

      const slug = slugFromBackingFile(backingFile, collection.absRoot);
      if (slug === null) return; // link escapes the collection root — leave as-is

      node.url = `${collection.prefix}/${slug}/${hash ? `#${hash}` : ''}`;

      // Feed the notes backlink graph (built in src/pages/notes/[...slug].astro)
      // via Astro's documented remarkPluginFrontmatter extension point — the
      // same channel remark-wiki-links.mjs writes to for `[[wiki-links]]`, so
      // both link styles produce one merged, deduplicated outbound-link list.
      if (collection.prefix === '/notes') {
        file.data.astro ??= {};
        file.data.astro.frontmatter ??= {};
        const outbound = (file.data.astro.frontmatter.outboundLinks ??= []);
        if (!outbound.includes(slug)) outbound.push(slug);
      }
    });
  };
}
