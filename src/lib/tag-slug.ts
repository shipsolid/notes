// Slugifies a note tag into a URL-safe route segment. Tags are free-text
// frontmatter, so this has to handle more than whitespace: a tag containing
// a "/" (e.g. "CI/CD") would otherwise fracture the URL into extra path
// segments and break static route generation for notes/tag/[tag].astro.
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
