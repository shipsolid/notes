import type { APIRoute } from 'astro';
import * as esbuild from 'esbuild';
// ?raw: Vite inlines the file's source text as a string at build time,
// resolved via its module graph — unlike a runtime fs read keyed off
// import.meta.url, this isn't affected by this endpoint's own output being
// relocated into dist/pages/ during the build.
import searchAnchorSource from '../lib/search-anchor.ts?raw';

export const prerender = true;

// Single source of truth for the anchor-scoring logic lives in
// src/lib/search-anchor.ts (typed, unit-tested by search-anchor.test.ts).
// search.astro's client script is is:inline (see the comment on its
// pagefind import for why) and so can't use a static `import` against a TS
// source file. This endpoint transpiles that same file to plain JS at build
// time and serves it at a stable URL the client script dynamically
// imports — the same pattern astro-pagefind already uses for
// /pagefind/pagefind.js, applied to our own module instead of a
// third-party one.
export const GET: APIRoute = async () => {
  const { code } = await esbuild.transform(searchAnchorSource, { loader: 'ts', format: 'esm' });

  return new Response(code, {
    headers: { 'Content-Type': 'text/javascript' },
  });
};
