import type { CollectionEntry } from 'astro:content';
import { slugifyTag } from './tag-slug';

export interface TagIndexEntry {
  slug: string;
  label: string;
  count: number;
}

// Aggregates every tag across the given notes into one global index, for a
// "browse all tags" page. Groups by slug rather than raw tag string for the
// same reason notes/tag/[tag].astro's getStaticPaths does — free-text tag
// casing drifts between notes (e.g. "Architecture" vs "architecture") and
// both should count toward one tag, not fork into two.
export function getTagIndex(notes: CollectionEntry<'notes'>[]): TagIndexEntry[] {
  const bySlug = new Map<string, { label: string; count: number }>();
  for (const note of notes) {
    for (const tag of note.data.tags) {
      const slug = slugifyTag(tag);
      const entry = bySlug.get(slug);
      if (entry) {
        entry.count += 1;
      } else {
        bySlug.set(slug, { label: tag, count: 1 });
      }
    }
  }
  return [...bySlug.entries()]
    .map(([slug, { label, count }]) => ({ slug, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
