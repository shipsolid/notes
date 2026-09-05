import { getCollection, render, type CollectionEntry } from 'astro:content';
import { isVisibleNote } from './notes-query';
import type { RelationKind } from './note-kinds';

type RenderedNote = Awaited<ReturnType<typeof render>>;

export interface NotesGraphEdge {
  source: string;
  target: string;
  // 'related' for edges discovered via [[wikilink]]/markdown-link outbound
  // links; the explicit kind declared in frontmatter `relations[]` otherwise.
  kind: RelationKind;
}

// Same kind precedence as NotesGraphEdge: an explicit `relations[]` kind always
// wins over the Pass-2 wikilink default of 'related' for the same source/target pair.
export interface BacklinkEntry {
  slug: string;
  kind: RelationKind;
}

export interface NotesGraphData {
  allNotes: CollectionEntry<'notes'>[];
  rendered: RenderedNote[];
  backlinkMap: Map<string, BacklinkEntry[]>; // target slug -> backlink entries
  edges: NotesGraphEdge[]; // deduped, undirected
}

export const DEFAULT_COLOR = '#9399b2'; // Catppuccin Mocha Overlay2

// OKLCH -> sRGB, used to compute the topic palette below at build time.
function oklchToHex(L: number, C: number, hueDeg: number): string {
  const h = (hueDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;

  const rl = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSrgbByte = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    const gamma = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
    return Math.round(gamma * 255).toString(16).padStart(2, '0');
  };
  return `#${toSrgbByte(rl)}${toSrgbByte(gl)}${toSrgbByte(bl)}`;
}

// Vibrant categorical wheel (dataviz skill method): chroma 0.15, lightness
// alternating 0.58/0.65 (both inside the dark-surface OKLCH L band 0.48-0.67),
// hue phase offset 165° — the params that maximized worst-case all-pairs
// Machado-2009 CVD ΔE across an exhaustive grid search for a 19-slot wheel
// (`validate_palette.js ... --mode dark --surface "#0b1220" --pairs all`:
// passes lightness band / chroma floor / contrast; worst pair ΔE 4.0). That's
// below the usual 8 floor because this many categories in one hue wheel is
// past what any palette can CVD-separate on its own — legal only because
// color is never the sole identity channel here: every legend chip and graph
// tooltip also carries the topic name as text (see GraphLegend.astro /
// NotesGraphCanvas.astro).
const PALETTE_CHROMA = 0.15;
const PALETTE_L: [number, number] = [0.58, 0.65];
const PALETTE_HUE_OFFSET = 165;

// Assigns one wheel slot per topic, alphabetically, so the mapping is stable
// across builds and never needs a hand-maintained hex per topic — add,
// rename, or remove a topic directory and this just re-spaces the wheel.
function buildTopicPalette(topics: string[]): Record<string, string> {
  const sorted = [...new Set(topics)].sort();
  const step = 360 / sorted.length;
  const palette: Record<string, string> = {};
  sorted.forEach((topic, i) => {
    const hue = (PALETTE_HUE_OFFSET + i * step) % 360;
    palette[topic] = oklchToHex(PALETTE_L[i % 2], PALETTE_CHROMA, hue);
  });
  return palette;
}

export function topicOf(id: string) {
  return id.split('/')[0];
}
export function topicLabel(topic: string) {
  return topic
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Nodes with zero edges in either direction — shared so the homepage embed
// and the full /notes/graph page always agree on which notes are orphaned.
export function getOrphanNotes(
  allNotes: CollectionEntry<'notes'>[],
  edges: NotesGraphEdge[]
): CollectionEntry<'notes'>[] {
  const touched = new Set<string>();
  edges.forEach((e) => {
    touched.add(e.source);
    touched.add(e.target);
  });
  return allNotes.filter((n) => !touched.has(n.id));
}

// 1-hop ego network for a single note's page: the note itself plus every note
// it links to or is linked from, and any edges among that whole set (so two
// neighbors that also link to each other still show a connection). Distinct
// from getOrphanNotes/full-graph helpers above in that it's per-note rather
// than corpus-wide — used by the local-graph panel on each note page.
export function getLocalSubgraph(
  slug: string,
  allNotes: CollectionEntry<'notes'>[],
  edges: NotesGraphEdge[]
): { nodes: CollectionEntry<'notes'>[]; edges: NotesGraphEdge[] } {
  const included = new Set<string>([slug]);
  edges.forEach((e) => {
    if (e.source === slug) included.add(e.target);
    if (e.target === slug) included.add(e.source);
  });

  return {
    nodes: allNotes.filter((n) => included.has(n.id)),
    edges: edges.filter((e) => included.has(e.source) && included.has(e.target)),
  };
}

export interface RelatedIndex {
  byTopic: Map<string, CollectionEntry<'notes'>[]>;
  byTag: Map<string, CollectionEntry<'notes'>[]>;
  // Pre-sorted by the same (updated desc, zettelId asc) tie-break the full
  // brute-force comparator falls through to once sharedTags/sameTopic both
  // run out — i.e. exactly the order the "0 shared tags, different topic"
  // bucket would sort into.
  byRecency: CollectionEntry<'notes'>[];
}

// Precomputes, once per build, the only two buckets that can ever outrank a
// "0 shared tags, different topic" note under getRelatedNotes' comparator.
// Scoring is restricted to their union, which is provably a superset of
// anything that could land in the top `limit` results — see getRelatedNotes.
export function buildRelatedIndex(allNotes: CollectionEntry<'notes'>[]): RelatedIndex {
  const byTopic = new Map<string, CollectionEntry<'notes'>[]>();
  const byTag = new Map<string, CollectionEntry<'notes'>[]>();

  for (const note of allNotes) {
    const topic = topicOf(note.id);
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(note);

    for (const tag of note.data.tags) {
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag)!.push(note);
    }
  }

  const byRecency = [...allNotes].sort(
    (a, b) =>
      (b.data.updated?.valueOf() ?? 0) - (a.data.updated?.valueOf() ?? 0) ||
      a.data.zettelId.localeCompare(b.data.zettelId)
  );

  return { byTopic, byTag, byRecency };
}

// Same ranking as the original per-note brute-force scan over every note
// (sharedTags desc, sameTopic desc, updated desc, zettelId asc as a total-order
// tie-break) but scores only the topic/tag candidate union instead of the
// whole corpus: every note in that union has sharedTags > 0 or sameTopic ===
// true, so it strictly outranks any note outside it, making the union a safe
// substitute for the full corpus. Pads from `byRecency` (skipping self and
// already-scored candidates) when fewer than `limit` candidates qualify.
export function getRelatedNotes(
  note: CollectionEntry<'notes'>,
  index: RelatedIndex,
  limit = 4
): CollectionEntry<'notes'>[] {
  const noteTopic = topicOf(note.id);
  const noteTags = new Set(note.data.tags);

  const seen = new Set<string>([note.id]);
  const candidates: CollectionEntry<'notes'>[] = [];
  const addCandidate = (n: CollectionEntry<'notes'>) => {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    candidates.push(n);
  };

  (index.byTopic.get(noteTopic) ?? []).forEach(addCandidate);
  for (const tag of noteTags) {
    (index.byTag.get(tag) ?? []).forEach(addCandidate);
  }

  const scored = candidates
    .map((n) => ({
      note: n,
      sharedTags: n.data.tags.filter((t) => noteTags.has(t)).length,
      sameTopic: topicOf(n.id) === noteTopic,
      updated: n.data.updated?.valueOf() ?? 0,
    }))
    .sort(
      (a, b) =>
        b.sharedTags - a.sharedTags ||
        Number(b.sameTopic) - Number(a.sameTopic) ||
        b.updated - a.updated ||
        a.note.data.zettelId.localeCompare(b.note.data.zettelId)
    )
    .map((r) => r.note);

  if (scored.length >= limit) return scored.slice(0, limit);

  const padded = [...scored];
  for (const n of index.byRecency) {
    if (padded.length >= limit) break;
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    padded.push(n);
  }
  return padded;
}

// Memoized at module scope: astro build runs as a single Node process, so
// every page that imports this module and calls getNotesGraph() during the
// same build shares one render-every-note pass instead of paying for it
// again (mirrors the noteIndex/titleCache memoization in remark-wiki-links.mjs).
let cached: Promise<NotesGraphData> | null = null;

export function getNotesGraph(): Promise<NotesGraphData> {
  return (cached ??= computeNotesGraph());
}

async function computeNotesGraph(): Promise<NotesGraphData> {
  // hidden !== excluded — hidden notes still get their own page and are
  // fully linkable (see src/pages/notes/shipsolid/index.astro), so the
  // graph must include them or it silently drops ~99% of the corpus.
  const allNotes = await getCollection('notes', (e) => isVisibleNote(e, { includeHidden: true }));
  const rendered = await Promise.all(allNotes.map((note) => render(note)));

  // remark plugins resolve link targets to slugs derived from on-disk paths,
  // which may not byte-for-byte match Astro's own slugification (e.g. case
  // folding on README.md). Normalize against Astro's authoritative entry ids so
  // backlinks/edges aren't silently dropped over a casing mismatch.
  const canonicalSlug = new Map(allNotes.map((n) => [n.id.toLowerCase(), n.id]));

  // target slug -> (source slug -> kind). A Map value so a (target, source) pair recorded once
  // in Pass 1 (explicit relations) is never overwritten by Pass 2's default 'related' — without
  // this, a note pair connected by BOTH an explicit relation and a same-target wikilink would
  // produce two backlink entries for the same source with conflicting kinds.
  const backlinksByTarget = new Map<string, Map<string, RelationKind>>();
  const edgeByKey = new Map<string, NotesGraphEdge>();

  function addEdge(sourceSlug: string, rawTarget: string, kind: RelationKind) {
    const target = canonicalSlug.get(rawTarget.toLowerCase()) ?? rawTarget;
    if (target === sourceSlug) return; // skip self-links

    if (!backlinksByTarget.has(target)) backlinksByTarget.set(target, new Map());
    const bySource = backlinksByTarget.get(target)!;
    if (!bySource.has(sourceSlug)) bySource.set(sourceSlug, kind);

    // Undirected, deduped: A->B and B->A collapse to one edge for the graph.
    const [source, edgeTarget] = [sourceSlug, target].sort();
    const key = `${source} ${edgeTarget}`;
    if (!edgeByKey.has(key)) edgeByKey.set(key, { source, target: edgeTarget, kind });
  }

  // Pass 1: explicit `relations` frontmatter first, so an authored relation
  // always wins the edge's kind label over an implicit wikilink discovery.
  allNotes.forEach((note) => {
    for (const rel of note.data.relations) addEdge(note.id, rel.slug, rel.kind);
  });
  // Pass 2: untyped [[wikilink]]/markdown-link edges, default 'related'.
  allNotes.forEach((note, i) => {
    const outboundLinks = rendered[i].remarkPluginFrontmatter?.outboundLinks ?? [];
    for (const rawTarget of outboundLinks) addEdge(note.id, rawTarget, 'related');
  });

  const backlinkMap = new Map<string, BacklinkEntry[]>();
  for (const [target, bySource] of backlinksByTarget) {
    backlinkMap.set(
      target,
      [...bySource].map(([slug, kind]) => ({ slug, kind }))
    );
  }

  return { allNotes, rendered, backlinkMap, edges: [...edgeByKey.values()] };
}

// Shared with any page that renders the graph (full /notes/graph view, the
// compact homepage embed, and per-note local-graph panels) so the topic ->
// color mapping never drifts between them. Memoized like getNotesGraph()
// itself since it's derived from the same corpus-wide pass.
let topicColorsCache: Promise<Record<string, string>> | null = null;

export function getTopicColors(): Promise<Record<string, string>> {
  return (topicColorsCache ??= computeTopicColors());
}

async function computeTopicColors(): Promise<Record<string, string>> {
  const { allNotes } = await getNotesGraph();
  return buildTopicPalette(allNotes.map((note) => topicOf(note.id)));
}
