import { describe, expect, it } from 'vitest';
import { buildTitleIndex, scoreAnchorCandidates, type NotesGraph } from './search-anchor';

function entry(title: string, neighborCount: number) {
  return {
    title,
    url: `/notes/${title}`,
    topic: 'test',
    neighbors: Array.from({ length: neighborCount }, (_, i) => ({
      slug: `n${i}`,
      title: `n${i}`,
      url: `/notes/n${i}`,
      topic: 'test',
      neighborCount: 0,
    })),
  };
}

describe('scoreAnchorCandidates', () => {
  it('prefers an exact title match over a richer text-hit candidate', () => {
    const notesGraph: NotesGraph = {
      'the-signals': entry('The Signals', 25),
      'unrelated-hub': entry('Some Other Hub', 50),
    };
    const titleIndex = buildTitleIndex(notesGraph);

    const best = scoreAnchorCandidates(notesGraph, titleIndex, 'The Signals', ['unrelated-hub']);

    expect(best?.title).toBe('The Signals');
  });

  it('does not title-match a query merely buried as a substring in an unrelated title (the "otlp" regression)', () => {
    const notesGraph: NotesGraph = {
      adr: entry('Signal Forge ADR-001: Log tailing instead of OTLP log export', 2),
      hub: entry('Naming & Label Schema', 12),
    };
    const titleIndex = buildTitleIndex(notesGraph);

    const best = scoreAnchorCandidates(notesGraph, titleIndex, 'otlp', ['adr', 'hub']);

    expect(best?.title).toBe('Naming & Label Schema');
  });

  it('falls back to the most-connected note among text hits when no title matches', () => {
    const notesGraph: NotesGraph = {
      sparse: entry('Sparse Note', 1),
      rich: entry('Rich Note', 10),
    };
    const titleIndex = buildTitleIndex(notesGraph);

    const best = scoreAnchorCandidates(notesGraph, titleIndex, 'something else entirely', ['sparse', 'rich']);

    expect(best?.title).toBe('Rich Note');
  });

  it('title-matches a short concept title fully contained in a longer query', () => {
    const notesGraph: NotesGraph = { card: entry('Cardinality', 5) };
    const titleIndex = buildTitleIndex(notesGraph);

    const best = scoreAnchorCandidates(notesGraph, titleIndex, 'what is cardinality', []);

    expect(best?.title).toBe('Cardinality');
  });

  it('rejects a short title match against a much longer query (ratio below threshold)', () => {
    const notesGraph: NotesGraph = { card: entry('Cardinality', 5) };
    const titleIndex = buildTitleIndex(notesGraph);

    const best = scoreAnchorCandidates(
      notesGraph,
      titleIndex,
      'a very long sentence that happens to mention cardinality once in passing',
      []
    );

    expect(best).toBeNull();
  });

  it('returns null when the only candidate has zero neighbors', () => {
    const notesGraph: NotesGraph = { orphan: entry('Orphan', 0) };
    const titleIndex = buildTitleIndex(notesGraph);

    const best = scoreAnchorCandidates(notesGraph, titleIndex, 'Orphan', []);

    expect(best).toBeNull();
  });

  it('returns null when there are no candidates at all', () => {
    const best = scoreAnchorCandidates({}, new Map(), 'anything', []);

    expect(best).toBeNull();
  });
});
