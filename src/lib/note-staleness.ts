import type { CollectionEntry } from 'astro:content';

// zettelId's leading 12 digits are YYYYMMDDHHMM (schema-enforced via the
// regex in src/content.config.ts, and CI-checked by scripts/notes/check-ids.mjs,
// so every note has one). Used as a fallback staleness signal for notes that
// never got an `updated` value, so undated notes don't read as infinitely
// stale and bury real signal from notes that genuinely haven't been touched.
function dateFromZettelId(zettelId: string): Date | null {
  const match = zettelId.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

export function getStalenessDate(note: CollectionEntry<'notes'>): Date | null {
  return note.data.updated ?? dateFromZettelId(note.data.zettelId);
}
