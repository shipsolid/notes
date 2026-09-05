import type { APIRoute } from 'astro';
import { getNotesGraph, topicOf } from '../lib/notes-graph';

export const prerender = true;

interface NeighborRef {
  slug: string;
  title: string;
  url: string;
  topic: string;
  neighborCount: number;
}

interface NoteNeighborhood {
  title: string;
  url: string;
  topic: string;
  neighbors: NeighborRef[];
}

// Static build artifact consumed by search.astro's client script — the
// Pagefind index it otherwise runs on has no concept of link edges, only
// free-text + the type/domain/tag facets. Adjacency is built once from
// `edges` (O(N+E)) rather than calling getLocalSubgraph() per note, which
// would rescan the full edge list for each of the ~1,167 notes (O(N·E)).
export const GET: APIRoute = async () => {
  const { allNotes, edges } = await getNotesGraph();
  const noteBySlug = new Map(allNotes.map((n): [string, typeof n] => [n.id, n]));

  const adjacency = new Map<string, Set<string>>();
  for (const { source, target } of edges) {
    if (!adjacency.has(source)) adjacency.set(source, new Set());
    if (!adjacency.has(target)) adjacency.set(target, new Set());
    adjacency.get(source)!.add(target);
    adjacency.get(target)!.add(source);
  }

  const graph: Record<string, NoteNeighborhood> = {};

  for (const note of allNotes) {
    const neighborSlugs = adjacency.get(note.id);
    const neighbors: NeighborRef[] = neighborSlugs
      ? [...neighborSlugs]
          .map((slug) => noteBySlug.get(slug))
          .filter((n): n is NonNullable<typeof n> => Boolean(n))
          .map((n) => ({
            slug: n.id,
            title: n.data.title,
            url: `/notes/${n.id}`,
            topic: topicOf(n.id),
            neighborCount: adjacency.get(n.id)?.size ?? 0,
          }))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

    graph[note.id] = {
      title: note.data.title,
      url: `/notes/${note.id}`,
      topic: topicOf(note.id),
      neighbors,
    };
  }

  return new Response(JSON.stringify(graph), {
    headers: { 'Content-Type': 'application/json' },
  });
};
