import type { CollectionEntry } from 'astro:content';
import { formatTopicLabel, notesIndexHref } from './notes-tree';

type Note = CollectionEntry<'notes'>;

export interface TopicReadiness {
  topicDir: string;
  label: string;
  href: string;
  total: number;
  stubCount: number;
  developedCount: number;
  readinessPct: number;
  interviewQuestionCount: number;
}

// A note counts as developed once its `[stub: ...]` doc-debt marker (see
// CLAUDE.md "Stub markers in docs") is gone. This is the only
// developed-vs-not signal actually populated across the corpus — the
// schema's own `maturity` field (seed/developing/evergreen) is unset on
// every note today and defaults to 'evergreen', so it can't back a
// readiness metric yet without every note silently reading as 100% ready.
// Exported so notes-develop-queue.ts shares this exact definition instead
// of re-deriving it.
// `body` is optional on a Content Layer entry (a loader may drop it); every
// glob-loaded markdown note has one, so a missing body means "not a stub".
export function isStub(note: Note): boolean {
  return note.body?.includes('[stub') ?? false;
}

// Per-topic rollup: how much of a topic is still stub placeholders, and how
// many notes are already tagged for interview-question review. Sorted
// weakest-readiness-first, so the biggest gap surfaces at the top; ties
// break toward the larger topic since that's the higher-leverage gap to close.
export function getTopicReadiness(notes: Note[]): TopicReadiness[] {
  const byTopic = new Map<string, Note[]>();
  for (const note of notes) {
    const topicDir = note.id.split('/')[0];
    if (!byTopic.has(topicDir)) byTopic.set(topicDir, []);
    byTopic.get(topicDir)!.push(note);
  }

  const rows = [...byTopic.entries()].map(([topicDir, topicNotes]): TopicReadiness => {
    const total = topicNotes.length;
    const stubCount = topicNotes.filter(isStub).length;
    const developedCount = total - stubCount;
    const interviewQuestionCount = topicNotes.filter((n) => n.data.kind === 'interview-question').length;
    return {
      topicDir,
      label: formatTopicLabel(topicDir),
      href: notesIndexHref(topicDir).base,
      total,
      stubCount,
      developedCount,
      readinessPct: total > 0 ? Math.round((developedCount / total) * 100) : 0,
      interviewQuestionCount,
    };
  });

  return rows.sort((a, b) => a.readinessPct - b.readinessPct || b.total - a.total);
}
