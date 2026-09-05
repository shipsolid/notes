import type { CollectionEntry } from 'astro:content';
import { isStub } from './notes-readiness';
import type { BacklinkEntry } from './notes-graph';

type Note = CollectionEntry<'notes'>;

export interface DevelopQueueEntry {
  note: Note;
  backlinkCount: number;
}

// Ranks stub notes by how many other notes already link to them — the
// highest-leverage gaps to close first, since developing one of these pays
// off every note that already points at it, instead of picking a stub at
// random out of the ~1,900-note backlog. Ties break on zettelId, the same
// deterministic tie-break getRelatedNotes uses elsewhere in the graph code.
export function getDevelopQueue(
  allNotes: Note[],
  backlinkMap: Map<string, BacklinkEntry[]>,
  limit = 8
): DevelopQueueEntry[] {
  return allNotes
    .filter(isStub)
    .map((note) => ({ note, backlinkCount: (backlinkMap.get(note.id) ?? []).length }))
    .sort(
      (a, b) =>
        b.backlinkCount - a.backlinkCount || a.note.data.zettelId.localeCompare(b.note.data.zettelId)
    )
    .slice(0, limit);
}
