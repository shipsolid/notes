import { describe, expect, it } from 'vitest';
import { getDevelopQueue } from './notes-develop-queue';
import type { BacklinkEntry } from './notes-graph';

function makeNote(id: string, zettelId: string, opts: { stub?: boolean } = {}) {
  const { stub = true } = opts;
  return {
    id,
    body: stub ? '> [stub: placeholder]\n' : '# Full content\n',
    data: { zettelId },
  } as any;
}

describe('getDevelopQueue', () => {
  it('excludes developed (non-stub) notes entirely', () => {
    const notes = [makeNote('a', '202601010000', { stub: false }), makeNote('b', '202601010001')];
    const queue = getDevelopQueue(notes, new Map());
    expect(queue.map((e) => e.note.id)).toEqual(['b']);
  });

  it('ranks stubs by inbound backlink count, most-referenced first', () => {
    const notes = [makeNote('rare', '202601010000'), makeNote('popular', '202601010001')];
    const backlinkMap = new Map<string, BacklinkEntry[]>([
      ['rare', [{ slug: 'x', kind: 'related' }]],
      ['popular', [{ slug: 'x', kind: 'related' }, { slug: 'y', kind: 'related' }, { slug: 'z', kind: 'related' }]],
    ]);
    const queue = getDevelopQueue(notes, backlinkMap);
    expect(queue.map((e) => e.note.id)).toEqual(['popular', 'rare']);
    expect(queue[0].backlinkCount).toBe(3);
  });

  it('treats a stub with no backlinks as zero, not missing', () => {
    const notes = [makeNote('orphan-stub', '202601010000')];
    const queue = getDevelopQueue(notes, new Map());
    expect(queue[0].backlinkCount).toBe(0);
  });

  it('breaks ties on zettelId ascending', () => {
    const notes = [makeNote('later', '202601020000'), makeNote('earlier', '202601010000')];
    const backlinkMap = new Map<string, BacklinkEntry[]>([
      ['later', [{ slug: 'x', kind: 'related' }]],
      ['earlier', [{ slug: 'y', kind: 'related' }]],
    ]);
    const queue = getDevelopQueue(notes, backlinkMap);
    expect(queue.map((e) => e.note.id)).toEqual(['earlier', 'later']);
  });

  it('respects the limit', () => {
    const notes = Array.from({ length: 12 }, (_, i) => makeNote(`n${i}`, `20260101${String(i).padStart(4, '0')}`));
    const queue = getDevelopQueue(notes, new Map(), 8);
    expect(queue).toHaveLength(8);
  });
});
