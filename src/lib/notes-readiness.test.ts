import { describe, expect, it } from 'vitest';
import { getTopicReadiness } from './notes-readiness';

function makeNote(id: string, opts: { stub?: boolean; kind?: string } = {}) {
  const { stub = false, kind = 'topic' } = opts;
  return {
    id,
    body: stub ? '> [stub: placeholder]\n' : '# Full content\n\nWritten out in full.\n',
    data: { kind },
  } as any;
}

describe('getTopicReadiness', () => {
  it('computes readinessPct from [stub] marker presence, not the unused maturity field', () => {
    const notes = [
      makeNote('kubernetes/a.md', { stub: false }),
      makeNote('kubernetes/b.md', { stub: true }),
      makeNote('kubernetes/c.md', { stub: true }),
      makeNote('kubernetes/d.md', { stub: true }),
    ];
    const [row] = getTopicReadiness(notes);
    expect(row.topicDir).toBe('kubernetes');
    expect(row.total).toBe(4);
    expect(row.stubCount).toBe(3);
    expect(row.developedCount).toBe(1);
    expect(row.readinessPct).toBe(25);
  });

  it('counts notes with kind interview-question separately from readiness', () => {
    const notes = [
      makeNote('system-design/a.md', { stub: false, kind: 'interview-question' }),
      makeNote('system-design/b.md', { stub: true, kind: 'interview-question' }),
      makeNote('system-design/c.md', { stub: false, kind: 'topic' }),
    ];
    const [row] = getTopicReadiness(notes);
    expect(row.interviewQuestionCount).toBe(2);
    expect(row.readinessPct).toBe(67);
  });

  it('sorts weakest readiness first, tie-breaking toward the larger topic', () => {
    const notes = [
      ...['a', 'b'].map((n) => makeNote(`small-topic/${n}.md`, { stub: false })), // 100% ready, size 2
      ...['a', 'b', 'c', 'd'].map((n) => makeNote(`big-topic/${n}.md`, { stub: true })), // 0% ready, size 4
      ...['a', 'b'].map((n) => makeNote(`tied-topic-1/${n}.md`, { stub: true })), // 0% ready, size 2
      ...['a', 'b', 'c'].map((n) => makeNote(`tied-topic-2/${n}.md`, { stub: true })), // 0% ready, size 3
    ];
    const order = getTopicReadiness(notes).map((r) => r.topicDir);
    expect(order).toEqual(['big-topic', 'tied-topic-2', 'tied-topic-1', 'small-topic']);
  });

  it('returns 0% readiness for an empty topic without dividing by zero', () => {
    const notes = [makeNote('only-topic/a.md', { stub: true })];
    const [row] = getTopicReadiness(notes);
    expect(row.readinessPct).toBe(0);
  });
});
