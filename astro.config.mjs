import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';
import { remarkRewriteMdLinks } from './remark-rewrite-md-links.mjs';
import { remarkWikiLinks } from './remark-wiki-links.mjs';

export default defineConfig({
  site: 'https://shipsolid.github.io',
  // GitHub Pages project-page deployment — this repo publishes to its own
  // Pages, not the shipsolid.github.io user-page repo, so it's served at
  // shipsolid.github.io/notes/ and every asset URL must resolve under that base.
  base: '/notes/',
  // Tailwind 4 is a first-class Vite plugin (see vite.plugins below), not an
  // Astro integration: @astrojs/tailwind has no Astro 7 release and v4 needs
  // none — @tailwindcss/vite replaces both it and the PostCSS bridge.
  integrations: [
    sitemap({
      // Pure redirect page, no unique content of its own to index.
      filter: (page) => !page.endsWith('/random/'),
    }),
    pagefind(),
  ],
  output: 'static',
  markdown: {
    remarkPlugins: [remarkWikiLinks, remarkRewriteMdLinks],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
