// Generic versioned localStorage shell. Intentionally thin — unlike pomo.astro's inlined
// loadJSON/saveJSON (which shallow-merges a fallback into flat config objects), flashcards
// storage is collection-shaped (maps/arrays of records), where spreading a fallback in would
// silently inject bogus keys. Each call site owns its own defaulting on top of this shell.
//
// Plain <script> tags in this site's .astro pages (no is:inline/define:vars) ARE bundled as
// real ES modules by Astro/Vite and CAN import this module — see src/pages/flashcards/stats.astro
// and src/pages/pomo.astro for call sites that do exactly that.

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Returns whether the write actually landed — callers that must not treat a subsequent
// derived-state update as valid unless this write succeeded (e.g. banking evicted totals only
// after the trimmed log itself is confirmed persisted) need this signal, not just a fire-and-forget.
export function saveJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // private browsing / quota exceeded — degrade to in-memory only
    return false;
  }
}

// For flat-config objects (like pomo's settings/stats) where a fallback should be deep-cloned
// and merged in, rather than left as a collection callers default piecemeal. `v` gates the merge:
// a version mismatch discards the persisted value entirely instead of shallow-merging an
// incompatible nested shape (e.g. ambientVolumes/dailyLog changing shape across a schema bump).
export function loadVersionedJSON<T extends { v: number }>(key: string, fallback: T): T {
  const parsed = loadJSON<T | null>(key, null);
  if (!parsed || parsed.v !== fallback.v) {
    return JSON.parse(JSON.stringify(fallback)); // deep clone — avoid aliasing nested objects
  }
  return { ...JSON.parse(JSON.stringify(fallback)), ...parsed };
}
