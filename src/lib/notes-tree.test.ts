import { describe, expect, it } from 'vitest';
import {
  buildNotesTree,
  flattenNotesInOrder,
  formatSegmentLabel,
  formatTopicLabel,
  notesIndexHref,
} from './notes-tree';

function makeNote(id: string) {
  return { id } as any;
}

describe('formatSegmentLabel', () => {
  it('glues a leading numeric prefix to the next word with a non-breaking space', () => {
    expect(formatSegmentLabel('01-platform-architecture')).toBe('01\u00A0Platform Architecture');
  });

  it('strips a leading underscore', () => {
    expect(formatSegmentLabel('_diagram')).toBe('Diagram');
  });
});

describe('buildNotesTree', () => {
  it('places a nested note in its deepest directory node, and a root note in rootNotes', () => {
    const nested = makeNote('shipsolid/01-platform-architecture/designs/deployment-strategy');
    const root = makeNote('shipsolid/readme');
    const tree = buildNotesTree([nested, root]);

    expect(tree.rootNotes).toEqual([root]);
    const platformNode = tree.sections.find((s) => s.key === '01-platform-architecture')!;
    const designsNode = platformNode.children.find((c) => c.key === 'designs')!;
    expect(designsNode.notes).toEqual([nested]);
    expect(designsNode.count).toBe(1);
    expect(platformNode.count).toBe(1);
  });

  it('sends a note directly under the topic (no subdirectory) to rootNotes, not a tree node', () => {
    const note = makeNote('patterns/file');
    const tree = buildNotesTree([note]);
    expect(tree.rootNotes).toEqual([note]);
    expect(tree.sections).toEqual([]);
  });
});

describe('flattenNotesInOrder', () => {
  const a = makeNote('topic/section/a');
  const root = makeNote('topic/root');
  const tree = buildNotesTree([a, root]);

  it('puts rootNotes first when rootPosition is "first"', () => {
    expect(flattenNotesInOrder(tree, 'first')).toEqual([root, a]);
  });

  it('puts rootNotes last when rootPosition is "last"', () => {
    expect(flattenNotesInOrder(tree, 'last')).toEqual([a, root]);
  });
});

describe('formatTopicLabel', () => {
  it('uses the override table for topics that do not round-trip through naive title-casing', () => {
    expect(formatTopicLabel('shipsolid')).toBe('ShipSolid');
  });

  it('falls back to naive title-casing for topics with no override', () => {
    expect(formatTopicLabel('system-design')).toBe('System Design');
  });
});

describe('notesIndexHref', () => {
  it('routes static topic pages to /notes/<topic> with root-first ordering', () => {
    expect(notesIndexHref('patterns')).toEqual({
      base: '/notes/patterns',
      anchorPrefix: 'section',
      rootLabel: 'Overview',
      rootPosition: 'first',
    });
  });

  it('routes non-static topics to the generic /notes/topic/<topic> catch-all with root-last ordering', () => {
    // Pins down the current asymmetry: the static branch does not lowercase
    // topicDir, the dynamic branch does — a future refactor must not
    // silently change either without a deliberate decision.
    expect(notesIndexHref('Observability')).toEqual({
      base: '/notes/topic/observability',
      anchorPrefix: 'subtopic',
      rootLabel: 'Other',
      rootPosition: 'last',
    });
  });
});
