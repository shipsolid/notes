import { describe, expect, it } from 'vitest';
import { getStalenessDate } from './note-staleness';

function makeNote(data: Partial<{ updated: Date; zettelId: string }>) {
  return { data } as any;
}

describe('getStalenessDate', () => {
  it('prefers the explicit `updated` date when present', () => {
    const updated = new Date('2026-01-01');
    const note = makeNote({ updated, zettelId: '202502020202' });
    expect(getStalenessDate(note)).toBe(updated);
  });

  it('falls back to the zettelId-derived date when `updated` is absent, ignoring the -N suffix', () => {
    const note = makeNote({ zettelId: '202507140930-1' });
    const result = getStalenessDate(note);
    expect(result).toEqual(new Date(2025, 6, 14, 9, 30));
  });
});
