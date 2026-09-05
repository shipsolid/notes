// Shared controlled vocabularies for the notes content schema and graph edges.
// Single source of truth so src/content.config.ts and src/lib/notes-graph.ts
// can never drift apart on valid values.
export const NOTE_KINDS = [
  'topic',
  'adr',
  'pattern',
  'anti-pattern',
  'incident',
  'lab',
  'decision',
  'tool',
  'interview-question',
] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export const RELATION_KINDS = ['depends_on', 'related', 'compared_to', 'supersedes'] as const;
export type RelationKind = (typeof RELATION_KINDS)[number];

export const RELATION_KIND_LABELS: Record<RelationKind, string> = {
  depends_on: 'Depends On',
  related: 'Related',
  compared_to: 'Compared To',
  supersedes: 'Supersedes',
};
