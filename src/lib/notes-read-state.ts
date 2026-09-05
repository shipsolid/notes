// Persisted "have I read this note" state, distinct from the ephemeral per-scroll
// progress bar in Note.astro. Collection-shaped (a growing map keyed by note slug),
// so callers use the plain loadJSON/saveJSON shell from storage.ts, not the
// versioned one — same rationale as flashcards' `fc:srs:<deckSlug>` keys.

export interface ReadEntry {
  readAt: string | null; // ISO timestamp when maxScrollPct first crossed READ_THRESHOLD_PCT, else null
  maxScrollPct: number; // highest scroll % ever observed for this note, 0-100
}

export type ReadState = Record<string, ReadEntry>; // note slug -> entry

export const READ_THRESHOLD_PCT = 90;

// Returns the SAME reference (state) if scrollPct doesn't advance maxScrollPct for this slug —
// callers use reference equality to decide whether a write to storage is needed.
export function recordScrollProgress(
  state: ReadState,
  slug: string,
  scrollPct: number,
  nowIso: string
): ReadState {
  const clamped = Math.max(0, Math.min(100, scrollPct));
  const existing = state[slug];

  if (existing && clamped <= existing.maxScrollPct) {
    return state;
  }

  const crossedThreshold = clamped >= READ_THRESHOLD_PCT;
  const readAt = existing?.readAt ?? (crossedThreshold ? nowIso : null);

  return {
    ...state,
    [slug]: {
      maxScrollPct: clamped,
      readAt,
    },
  };
}

export function isRead(state: ReadState, slug: string): boolean {
  return state[slug]?.readAt != null;
}
