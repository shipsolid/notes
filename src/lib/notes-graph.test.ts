import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRelatedIndex, getLocalSubgraph, getOrphanNotes, getRelatedNotes, topicLabel, topicOf } from './notes-graph';
import type { NotesGraphEdge } from './notes-graph';

function makeNote(id: string) {
  return { id, data: {} } as any;
}

function makeRelatedNote(
  id: string,
  { tags = [] as string[], updated, zettelId }: { tags?: string[]; updated?: Date; zettelId: string }
) {
  return { id, data: { tags, updated, zettelId } } as any;
}

describe('topicOf', () => {
  it('returns the first path segment as the topic', () => {
    expect(topicOf('shipsolid/foo/bar')).toBe('shipsolid');
  });

  it('returns the whole id when there is no slash', () => {
    expect(topicOf('readme')).toBe('readme');
  });
});

describe('topicLabel', () => {
  it('title-cases a hyphenated topic', () => {
    expect(topicLabel('agentic-ai')).toBe('Agentic Ai');
  });

  it('title-cases a single-word topic', () => {
    expect(topicLabel('patterns')).toBe('Patterns');
  });
});

describe('getOrphanNotes', () => {
  it('returns only notes untouched by any edge', () => {
    const a = makeNote('topic/a');
    const b = makeNote('topic/b');
    const c = makeNote('topic/c');
    const edges: NotesGraphEdge[] = [{ source: 'topic/a', target: 'topic/b', kind: 'related' }];
    expect(getOrphanNotes([a, b, c], edges)).toEqual([c]);
  });

  it('returns every note when there are no edges at all', () => {
    const a = makeNote('topic/a');
    const b = makeNote('topic/b');
    expect(getOrphanNotes([a, b], [])).toEqual([a, b]);
  });
});

describe('getLocalSubgraph', () => {
  it('includes neighbor-to-neighbor edges, not just edges touching the center note', () => {
    const center = makeNote('topic/center');
    const n1 = makeNote('topic/n1');
    const n2 = makeNote('topic/n2');
    const edges: NotesGraphEdge[] = [
      { source: 'topic/center', target: 'topic/n1', kind: 'related' },
      { source: 'topic/center', target: 'topic/n2', kind: 'related' },
      { source: 'topic/n1', target: 'topic/n2', kind: 'related' },
    ];
    const { nodes, edges: localEdges } = getLocalSubgraph('topic/center', [center, n1, n2], edges);
    expect(nodes).toEqual([center, n1, n2]);
    expect(localEdges).toHaveLength(3);
  });

  it('returns an empty node list for a slug absent from both notes and edges', () => {
    const a = makeNote('topic/a');
    const { nodes, edges } = getLocalSubgraph('topic/missing', [a], []);
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });
});

describe('computeNotesGraph / getNotesGraph', () => {
  // Module-scoped memoization means each scenario needs a fresh module
  // instance — reset the registry and re-import after each doMock.
  beforeEach(() => {
    vi.resetModules();
  });

  function mockCollection(all: any[]) {
    vi.doMock('astro:content', () => ({
      getCollection: async (_name: string, filter?: (entry: any) => boolean) =>
        filter ? all.filter(filter) : all,
      // Content Layer: rendering moved off the entry onto a free function. Each
      // fixture below still carries its own `render` so the per-note payload
      // stays next to the note it belongs to.
      render: async (entry: any) => entry.render(),
    }));
  }

  it('excludes self-links from both the backlink map and the edge list', async () => {
    const a = {
      id: 'topic/a',
      data: { relations: [] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: ['topic/a'] } }),
    };
    mockCollection([a]);

    const { getNotesGraph } = await import('./notes-graph');
    const graph = await getNotesGraph();

    expect(graph.edges).toEqual([]);
    expect(graph.backlinkMap.size).toBe(0);
  });

  it('dedupes A->B and B->A into a single undirected edge', async () => {
    const a = {
      id: 'topic/a',
      data: { relations: [] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: ['topic/b'] } }),
    };
    const b = {
      id: 'topic/b',
      data: { relations: [] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: ['topic/a'] } }),
    };
    mockCollection([a, b]);

    const { getNotesGraph } = await import('./notes-graph');
    const graph = await getNotesGraph();

    expect(graph.edges).toHaveLength(1);
  });

  it('resolves an outbound link target that differs only in case via canonicalSlug', async () => {
    const a = {
      id: 'topic/a',
      data: { relations: [] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: ['Topic/README'] } }),
    };
    const readme = {
      id: 'topic/readme',
      data: { relations: [] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: [] } }),
    };
    mockCollection([a, readme]);

    const { getNotesGraph } = await import('./notes-graph');
    const graph = await getNotesGraph();

    expect(graph.backlinkMap.get('topic/readme')).toEqual([{ slug: 'topic/a', kind: 'related' }]);
    expect(graph.edges).toEqual([{ source: 'topic/a', target: 'topic/readme', kind: 'related' }]);
  });

  it('records the explicit relation kind in the backlink entry, not just "related"', async () => {
    const a = {
      id: 'topic/a',
      data: { relations: [{ slug: 'topic/b', kind: 'depends_on' }] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: [] } }),
    };
    const b = {
      id: 'topic/b',
      data: { relations: [] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: [] } }),
    };
    mockCollection([a, b]);

    const { getNotesGraph } = await import('./notes-graph');
    const graph = await getNotesGraph();

    expect(graph.backlinkMap.get('topic/b')).toEqual([{ slug: 'topic/a', kind: 'depends_on' }]);
  });

  it('dedupes a pair linked by both an explicit relation and a wikilink into one backlink entry, keeping the explicit kind', async () => {
    const a = {
      id: 'topic/a',
      // Both an explicit relation AND a same-target wikilink to topic/b — Pass 1 (relations)
      // must win the kind, and the pair must collapse to a single backlink entry, not two.
      data: { relations: [{ slug: 'topic/b', kind: 'depends_on' }] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: ['topic/b'] } }),
    };
    const b = {
      id: 'topic/b',
      data: { relations: [] },
      render: async () => ({ remarkPluginFrontmatter: { outboundLinks: [] } }),
    };
    mockCollection([a, b]);

    const { getNotesGraph } = await import('./notes-graph');
    const graph = await getNotesGraph();

    expect(graph.backlinkMap.get('topic/b')).toEqual([{ slug: 'topic/a', kind: 'depends_on' }]);
  });
});

describe('getRelatedNotes', () => {
  it('ranks by sharedTags desc, then sameTopic, then updated desc, then zettelId asc, when >= limit candidates qualify', () => {
    const note = makeRelatedNote('topic/note', {
      tags: ['a', 'b'],
      zettelId: '202501010000',
    });
    // 2 shared tags, older
    const twoTagsOld = makeRelatedNote('topic/two-tags-old', {
      tags: ['a', 'b'],
      updated: new Date('2025-01-01'),
      zettelId: '202501020000',
    });
    // 2 shared tags, newer — should outrank twoTagsOld
    const twoTagsNew = makeRelatedNote('topic/two-tags-new', {
      tags: ['a', 'b'],
      updated: new Date('2026-01-01'),
      zettelId: '202501030000',
    });
    // 1 shared tag, same topic
    const oneTagSameTopic = makeRelatedNote('topic/one-tag', {
      tags: ['a'],
      zettelId: '202501040000',
    });
    // 0 shared tags, same topic only
    const sameTopicOnly = makeRelatedNote('topic/same-topic-only', {
      tags: [],
      zettelId: '202501050000',
    });
    // 0 shared tags, different topic — must never appear ahead of the above
    const unrelated = makeRelatedNote('other/unrelated', {
      tags: ['z'],
      zettelId: '202501060000',
    });

    const index = buildRelatedIndex([note, twoTagsOld, twoTagsNew, oneTagSameTopic, sameTopicOnly, unrelated]);
    const result = getRelatedNotes(note, index, 4);

    expect(result.map((n) => n.id)).toEqual([
      'topic/two-tags-new',
      'topic/two-tags-old',
      'topic/one-tag',
      'topic/same-topic-only',
    ]);
  });

  it('pads from byRecency when fewer than `limit` candidates share a topic or tag', () => {
    const note = makeRelatedNote('topic-a/note', {
      tags: ['unique-tag'],
      zettelId: '202501010000',
    });
    // Only one real candidate: shares no topic, no tag, with the note above.
    const other1 = makeRelatedNote('topic-b/other1', {
      tags: ['x'],
      updated: new Date('2026-02-01'),
      zettelId: '202501020000',
    });
    const other2 = makeRelatedNote('topic-c/other2', {
      tags: ['y'],
      updated: new Date('2026-01-01'),
      zettelId: '202501030000',
    });

    const index = buildRelatedIndex([note, other1, other2]);
    const result = getRelatedNotes(note, index, 4);

    // No candidates qualify via topic/tag, so the entire result is padding
    // from byRecency (updated desc), excluding self.
    expect(result.map((n) => n.id)).toEqual(['topic-b/other1', 'topic-c/other2']);
  });
});
