import { describe, expect, it } from 'vitest';
import { slugifyTag } from './tag-slug';

describe('slugifyTag', () => {
  it('lowercases and replaces non-alphanumeric runs with a hyphen', () => {
    expect(slugifyTag('CI/CD')).toBe('ci-cd');
  });

  it('collapses an all-punctuation tag to an empty string', () => {
    // Documents the collision risk: two differently-punctuated tags with no
    // alphanumeric content both slugify to '', colliding on the same tag route.
    expect(slugifyTag('???')).toBe('');
  });
});
