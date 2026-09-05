import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { NOTE_KINDS, RELATION_KINDS } from './lib/note-kinds';

// No `generateId` overrides below: the glob loader's default already runs each path
// segment through github-slugger and strips a trailing `/index`, which is byte-for-byte
// the rule the pre-Content-Layer `entry.slug` used. Verified across every entry —
// each `id` equals the slug that produced the current route list.
//
// `[^_]*` reproduces the other half of the old contract: the legacy content-collection
// loader silently skipped underscore-prefixed files, and five `_template.md` scaffolds
// rely on that (a plain `**/*.md` would publish them as real pages).

const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    hidden: z.boolean().default(false),
    // Permanent Zettelkasten-style identifier, stamped by scripts/notes/stamp-metadata.mjs.
    // Distinct from Astro's own `entry.id` (the path-derived collection key) to avoid confusion
    // between "which file is this" (entry.id) and "this note's permanent identity" (zettelId).
    zettelId: z.string().regex(/^\d{12}(-\d+)?$/),
    // Named `noteType`, not `type` — one existing file already used a bare
    // `type:` frontmatter key for an unrelated doc-type classification (RFC),
    // and a shared schema would have forced that meaning to collide with
    // this one.
    noteType: z.enum(['note', 'moc']).default('note'),
    // Content classification — orthogonal to noteType's hub-vs-leaf
    // distinction. Named `kind`, not `type`, for the same collision reason
    // as noteType above: this is exactly the field name an external
    // generator (the Notion pipeline) could be tempted to reintroduce.
    kind: z.enum(NOTE_KINDS).default('topic'),
    // Lightweight maturity marker for the note itself. Deliberately NOT the
    // ADR body's own Proposed/Accepted/Rejected/Superseded lifecycle (that
    // stays unparsed prose in the ADR body). Default 'evergreen' is a
    // .strict()-compatibility choice, not a quality claim.
    maturity: z.enum(['seed', 'developing', 'evergreen']).default('evergreen'),
    // Typed, machine-readable relationships — makes ADR "Supersedes"/
    // "Related RFC" (currently unparsed body prose) queryable. References
    // targets by slug, consistent with wiki-links/backlinks/graph edges,
    // which all key off slug already (no slug<->zettelId index exists).
    relations: z
      .array(z.object({ slug: z.string(), kind: z.enum(RELATION_KINDS) }))
      .default([]),
  }).strict(),
});

export const collections = { notes };
