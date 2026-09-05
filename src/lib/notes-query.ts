import type { CollectionEntry } from 'astro:content';

type Note = CollectionEntry<'notes'>;

export interface VisibilityOptions {
  includeHidden?: boolean;
  noteType?: Note['data']['noteType'];
  topicPrefix?: string;
}

// Centralizes the notes visibility predicate. Every getCollection('notes', ...)
// call site previously hand-rolled its own combination of !draft/!hidden/
// noteType/topic-prefix checks — easy to copy the wrong variant since hidden
// !== excluded (see notes-graph.ts): most call sites should drop hidden notes
// from a generic listing, but a topic's own dedicated entry point must
// include them, or it collapses to almost nothing.
export function isVisibleNote(entry: Pick<Note, 'id' | 'data'>, opts: VisibilityOptions = {}): boolean {
  const { includeHidden = false, noteType, topicPrefix } = opts;
  if (entry.data.draft) return false;
  if (!includeHidden && entry.data.hidden) return false;
  if (noteType && entry.data.noteType !== noteType) return false;
  if (topicPrefix && !entry.id.startsWith(`${topicPrefix}/`)) return false;
  return true;
}

export function byUpdatedDesc(a: Note, b: Note): number {
  return (b.data.updated?.valueOf() ?? 0) - (a.data.updated?.valueOf() ?? 0);
}

// Sorts on the real on-disk filename so a directory's own file sequencing
// (e.g. "01-", "02-" prefixes) survives into the SSR output. Deliberately
// `filePath` and not `id`: the Content Layer id drops the ".md", which flips
// sibling pairs like "logging.md" / "logging-guidelines.md" ("logging" is a
// prefix of "logging-guidelines", but "logging." sorts after "logging-").
// non-null: the glob loader always sets filePath, and falling back to `id` would
// silently restore the ordering this function exists to avoid.
function fileNameOf(note: Pick<Note, 'filePath'>): string {
  return note.filePath!.split('/').pop() ?? '';
}

export function byFilenameAsc(a: Note, b: Note): number {
  return fileNameOf(a).localeCompare(fileNameOf(b));
}
