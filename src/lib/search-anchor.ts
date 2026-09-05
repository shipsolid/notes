export interface AnchorNeighbor {
  slug: string;
  title: string;
  url: string;
  topic: string;
  neighborCount: number;
}

export interface AnchorEntry {
  title: string;
  url: string;
  topic: string;
  neighbors: AnchorNeighbor[];
}

export type NotesGraph = Record<string, AnchorEntry>;

export interface ScoredAnchor extends AnchorEntry {
  slug: string;
  titleScore: number;
}

const MIN_TITLE_MATCH_LEN = 3;
const TITLE_MATCH_RATIO = 0.5;

// Precomputed once per notesGraph load (search.astro's main()) instead of
// re-normalizing every title on every keystroke in scoreAnchorCandidates.
export function buildTitleIndex(notesGraph: NotesGraph): Map<string, string> {
  const index = new Map<string, string>();
  for (const [slug, entry] of Object.entries(notesGraph)) {
    index.set(slug, entry.title.trim().toLowerCase());
  }
  return index;
}

// Picks the best anchor note for a search query from two candidate pools:
// notes whose title matches the query text (independent of Pagefind's text
// ranking), and Notes among Pagefind's own top raw hits (textHitSlugs).
// Title matches always outrank text-only hits; within a tier, the
// most-connected note wins. Plain "first Note in Pagefind's ranking" used to
// pick whichever note mentions a term most densely (a 192-word ADR saying
// "OTLP" 7 times) over far richer notes that only mention it in passing.
//
// A raw substring "contains" check alone matches too loosely — e.g. an ADR
// titled "...instead of OTLP log export" contains "otlp" as a substring
// despite not being about OTLP at all. Requiring the shorter side to cover
// at least half the longer side's length rejects a query word merely buried
// in an unrelated title while still matching "distributed tracing" against
// "Distributed Tracing Backend", or "cardinality" against "What is
// Cardinality...".
export function scoreAnchorCandidates(
  notesGraph: NotesGraph,
  titleIndex: Map<string, string>,
  query: string,
  textHitSlugs: string[]
): ScoredAnchor | null {
  const normalizedQuery = query.trim().toLowerCase();
  const candidates = new Map<string, ScoredAnchor>();

  for (const [slug, normTitle] of titleIndex) {
    let titleScore = 0;
    if (normTitle === normalizedQuery) {
      titleScore = 2;
    } else if (normalizedQuery.length > MIN_TITLE_MATCH_LEN) {
      if (normTitle.includes(normalizedQuery) && normalizedQuery.length / normTitle.length >= TITLE_MATCH_RATIO) {
        titleScore = 1;
      } else if (normalizedQuery.includes(normTitle) && normTitle.length / normalizedQuery.length >= TITLE_MATCH_RATIO) {
        titleScore = 1;
      }
    }
    if (titleScore > 0) candidates.set(slug, { slug, ...notesGraph[slug], titleScore });
  }

  for (const slug of textHitSlugs) {
    if (candidates.has(slug)) continue;
    const entry = notesGraph[slug];
    if (entry) candidates.set(slug, { slug, ...entry, titleScore: 0 });
  }

  const best = [...candidates.values()]
    .filter((c) => c.neighbors.length > 0)
    .sort((a, b) => b.titleScore - a.titleScore || b.neighbors.length - a.neighbors.length)[0];

  return best ?? null;
}
