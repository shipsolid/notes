import { describe, expect, it } from 'vitest';
import { READ_THRESHOLD_PCT, recordScrollProgress, isRead, type ReadState } from './notes-read-state';

const NOW = '2026-08-27T10:00:00.000Z';
const LATER = '2026-08-27T10:05:00.000Z';

describe('recordScrollProgress', () => {
  it('creates a new entry on first call', () => {
    const state = recordScrollProgress({}, 'foo', 40, NOW);
    expect(state.foo).toEqual({ maxScrollPct: 40, readAt: null });
  });

  it('returns the same reference when scrollPct does not exceed the recorded max', () => {
    const state = recordScrollProgress({}, 'foo', 40, NOW);
    const next = recordScrollProgress(state, 'foo', 30, LATER);
    expect(next).toBe(state);
  });

  it('returns the same reference when scrollPct equals the recorded max', () => {
    const state = recordScrollProgress({}, 'foo', 40, NOW);
    const next = recordScrollProgress(state, 'foo', 40, LATER);
    expect(next).toBe(state);
  });

  it('sets readAt when maxScrollPct crosses the threshold', () => {
    const state = recordScrollProgress({}, 'foo', 50, NOW);
    const next = recordScrollProgress(state, 'foo', READ_THRESHOLD_PCT, LATER);
    expect(next).not.toBe(state);
    expect(next.foo).toEqual({ maxScrollPct: READ_THRESHOLD_PCT, readAt: LATER });
  });

  it('keeps the original readAt on a later crossing-threshold call', () => {
    let state: ReadState = {};
    state = recordScrollProgress(state, 'foo', READ_THRESHOLD_PCT, NOW);
    state = recordScrollProgress(state, 'foo', 100, LATER);
    expect(state.foo).toEqual({ maxScrollPct: 100, readAt: NOW });
  });

  it('never lowers maxScrollPct or unsets readAt when scrolling back up', () => {
    let state: ReadState = {};
    state = recordScrollProgress(state, 'foo', 100, NOW);
    const next = recordScrollProgress(state, 'foo', 10, LATER);
    expect(next).toBe(state);
    expect(next.foo).toEqual({ maxScrollPct: 100, readAt: NOW });
  });

  it('clamps scrollPct to [0, 100]', () => {
    const state = recordScrollProgress({}, 'foo', 150, NOW);
    expect(state.foo.maxScrollPct).toBe(100);

    const state2 = recordScrollProgress({}, 'bar', -20, NOW);
    expect(state2.bar.maxScrollPct).toBe(0);
  });

  it('tracks a different slug independently', () => {
    const state = recordScrollProgress({}, 'foo', 95, NOW);
    const next = recordScrollProgress(state, 'bar', 10, LATER);
    expect(next).not.toBe(state);
    expect(next.foo).toEqual({ maxScrollPct: 95, readAt: NOW });
    expect(next.bar).toEqual({ maxScrollPct: 10, readAt: null });
  });

  it('does not mutate the input state object', () => {
    const state = recordScrollProgress({}, 'foo', 40, NOW);
    const snapshot = { ...state };
    recordScrollProgress(state, 'foo', 80, LATER);
    expect(state).toEqual(snapshot);
  });
});

describe('isRead', () => {
  it('is false for an unknown slug', () => {
    expect(isRead({}, 'foo')).toBe(false);
  });

  it('is false for a slug below the threshold', () => {
    const state = recordScrollProgress({}, 'foo', 50, NOW);
    expect(isRead(state, 'foo')).toBe(false);
  });

  it('is true once the threshold has been crossed', () => {
    const state = recordScrollProgress({}, 'foo', READ_THRESHOLD_PCT, NOW);
    expect(isRead(state, 'foo')).toBe(true);
  });
});
