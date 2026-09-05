import type { CollectionEntry } from 'astro:content';

type Note = CollectionEntry<'notes'>;

export interface NoteTreeNode {
  key: string;
  label: string;
  pathKey: string;
  depth: number;
  notes: Note[];
  children: NoteTreeNode[];
  count: number;
}

export interface NotesTree {
  rootNotes: Note[];
  sections: NoteTreeNode[];
}

interface MutableNode {
  key: string;
  pathKey: string;
  depth: number;
  notes: Note[];
  children: Map<string, MutableNode>;
}

// "01-platform-architecture" -> "01 Platform Architecture"; a leading numeric
// prefix is an ordering convention, not its own word, so it's glued to the
// next word with a non-breaking space to stop it wrapping onto its own line
// in narrow sidebar columns.
export function formatSegmentLabel(segment: string): string {
  const words = segment
    .replace(/^_/, '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (words.length > 1 && /^\d+$/.test(words[0])) {
    words.splice(0, 2, `${words[0]} ${words[1]}`);
  }
  return words.join(' ');
}

// Groups notes into an arbitrary-depth tree from their file path alone
// (note.id looks like "shipsolid/app-signal-forge/architecture/adrs/0001").
// A note lands in the *deepest* directory node's own `notes[]`; every
// ancestor only accumulates it into `count`. Notes with no directory at all
// (e.g. "shipsolid/readme") go to `rootNotes`, not a tree node.
//
// Ordering/filtering is intentionally NOT this function's job: callers
// already decide note order (sort by `updated` desc) and hidden/draft
// inclusion before calling this, and those rules differ per topic family —
// baking them in here would silently override page-specific behavior.
export function buildNotesTree(notes: Note[]): NotesTree {
  const rootNotes: Note[] = [];
  const top = new Map<string, MutableNode>();

  for (const note of notes) {
    const parts = note.id.split('/').slice(1); // drop the topic segment
    if (parts.length <= 1) {
      rootNotes.push(note);
      continue;
    }

    const dirSegments = parts.slice(0, -1); // every dir between topic and filename
    let level = top;
    let node: MutableNode | undefined;
    let pathKey = '';
    for (let i = 0; i < dirSegments.length; i++) {
      const seg = dirSegments[i];
      pathKey = pathKey ? `${pathKey}-${seg}` : seg;
      if (!level.has(seg)) {
        level.set(seg, { key: seg, pathKey, depth: i + 1, notes: [], children: new Map() });
      }
      node = level.get(seg)!;
      level = node.children;
    }
    node!.notes.push(note);
  }

  function finalize(map: Map<string, MutableNode>): NoteTreeNode[] {
    return [...map.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((n): NoteTreeNode => {
        const children = finalize(n.children);
        const count = n.notes.length + children.reduce((sum, c) => sum + c.count, 0);
        return {
          key: n.key,
          label: formatSegmentLabel(n.key),
          pathKey: n.pathKey,
          depth: n.depth,
          notes: n.notes,
          children,
          count,
        };
      });
  }

  return { rootNotes, sections: finalize(top) };
}

// Flattens a tree into the same linear order its sidebar renders in, for
// prev/next navigation. `rootPosition` matches whichever family this topic
// belongs to (see notesIndexHref).
export function flattenNotesInOrder(tree: NotesTree, rootPosition: 'first' | 'last'): Note[] {
  const result: Note[] = [];

  function walk(nodes: NoteTreeNode[]) {
    for (const node of nodes) {
      result.push(...node.notes);
      walk(node.children);
    }
  }

  if (rootPosition === 'first') result.push(...tree.rootNotes);
  walk(tree.sections);
  if (rootPosition === 'last') result.push(...tree.rootNotes);

  return result;
}

// Topics with their own dedicated static listing page (as opposed to falling
// through to the generic notes/topic/[topic].astro catch-all route).
//
// "shipsolid" is deliberately NOT here: its content actually lives under
// projects/platform-shipsolid/, not a top-level shipsolid/ directory, so the
// topicPrefix filter in src/pages/notes/[topic].astro would never match any
// note and the page would render empty. It's reachable via the generic
// /notes/topic/projects listing instead.
export const STATIC_TOPIC_PAGES = new Set(['system-design', 'patterns']);

// Per-topic copy for each STATIC_TOPIC_PAGES entry, rendered by the single
// data-driven src/pages/notes/[topic].astro route.
export const STATIC_TOPIC_METADATA: Record<
  string,
  { pageTitle: string; pageDescription: string; eyebrow: string; heroTitle: string; heroDescription: string }
> = {
  patterns: {
    pageTitle: 'Patterns',
    pageDescription:
      'Reusable engineering patterns for distributed systems, observability, reliability, and platform design — grounded in production experience at scale.',
    eyebrow: 'Patterns',
    heroTitle: 'Patterns',
    heroDescription:
      'Reusable engineering patterns for distributed systems, observability, and reliability — grounded in production experience at scale.',
  },
  'system-design': {
    pageTitle: 'System Design Notes',
    pageDescription:
      'Principal/Staff-level system design references — observability pipelines, distributed systems, reliability engineering, and trade-offs at scale.',
    eyebrow: 'System Design',
    heroTitle: 'System Design',
    heroDescription:
      'Principal/Staff-level design references — requirements, architecture, deep dives, and trade-offs at scale. Structured for L6/L7 MAANG interviews.',
  },
};

// Brand-cased overrides for topics whose directory name doesn't round-trip
// through generic title-casing (e.g. "shipsolid" -> "ShipSolid", not "Shipsolid").
const TOPIC_LABEL_OVERRIDES: Record<string, string> = {
  shipsolid: 'ShipSolid',
};

export function formatTopicLabel(topicDir: string): string {
  return (
    TOPIC_LABEL_OVERRIDES[topicDir] ??
    topicDir
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

export function notesIndexHref(topicDir: string): {
  base: string;
  anchorPrefix: 'section' | 'subtopic';
  rootLabel: string;
  rootPosition: 'first' | 'last';
} {
  if (STATIC_TOPIC_PAGES.has(topicDir)) {
    return { base: `/notes/${topicDir}`, anchorPrefix: 'section', rootLabel: 'Overview', rootPosition: 'first' };
  }
  return {
    base: `/notes/topic/${topicDir.toLowerCase()}`,
    anchorPrefix: 'subtopic',
    rootLabel: 'Other',
    rootPosition: 'last',
  };
}
