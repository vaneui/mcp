import { INTRO_SECTION, headingText, loadCorpus, slugifyHeading, type DocSection, type ParsedDoc } from "./docs.js";
import { uriFor } from "./resources.js";

/** Letters and digits only, so `IconButton`, `icon-button` and `Icon_Button` compare equal. */
function compactKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * What a caller may pass for a page: a slug, a file name, a resource URI or a docs link.
 * Keeps the last path segment without its `.md`, and the fragment if there is one.
 */
function splitReference(input: string): { name: string; fragment?: string } {
  let value = input.trim();
  let fragment: string | undefined;
  const hash = value.indexOf("#");
  if (hash !== -1) {
    fragment = value.slice(hash + 1).trim() || undefined;
    value = value.slice(0, hash);
  }
  value = value.replace(/\?.*$/, "").replace(/\/+$/, "");
  const name = value.slice(value.lastIndexOf("/") + 1).replace(/\.mdx?$/i, "");
  return { name, fragment };
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * Known names close to one that matched nothing, best first: names that contain the input
 * or are contained in it (`modal` for `ModalHeader`), then near misspellings.
 */
export function suggest(input: string, known: readonly string[], limit = 3): string[] {
  const key = compactKey(input);
  if (!key) return [];
  const scored: { name: string; distance: number }[] = [];
  for (const name of known) {
    const candidate = compactKey(name);
    if (!candidate) continue;
    const shorter = Math.min(key.length, candidate.length);
    if (shorter >= 3 && (key.includes(candidate) || candidate.includes(key))) {
      scored.push({ name, distance: Math.abs(key.length - candidate.length) / 100 });
      continue;
    }
    const distance = editDistance(key, candidate);
    if (distance <= Math.max(1, Math.floor(shorter / 3))) scored.push({ name, distance });
  }
  return scored
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((entry) => entry.name);
}

/**
 * Finds the known slug a reference means, or `undefined`. Case, separators, a `.md`
 * extension and any path before the name are ignored: `Icon-Button.md`, `iconButton`,
 * `vaneui://docs/icon-button` and `/docs/basic-components/icon-button` are all `icon-button`.
 */
export function matchSlug(input: string, known: readonly string[]): string | undefined {
  const key = compactKey(splitReference(input).name);
  if (!key) return undefined;
  return known.find((slug) => compactKey(slug) === key);
}

function didYouMean(input: string, known: readonly string[]): string {
  const close = suggest(input, known);
  return close.length > 0 ? ` Did you mean: ${close.join(", ")}?` : "";
}

export interface GetDocArgs {
  slug: string;
  section?: string;
}

function trimBlankLines(lines: string[]): string[] {
  let from = 0;
  let to = lines.length;
  while (from < to && lines[from].trim() === "") from++;
  while (to > from && lines[to - 1].trim() === "") to--;
  return lines.slice(from, to);
}

function findSection(doc: ParsedDoc, input: string): DocSection {
  // An id, a heading as written (`## Sizes`, `Sizes`) or a docs link fragment all slug to the id.
  const wanted = input.trim().replace(/^#+\s*/, "");
  const id = slugifyHeading(headingText(wanted));
  const found = doc.sections.find((section) => section.id === id);
  if (found) return found;
  const ids = doc.sections.map((section) => section.id);
  throw new Error(
    `No section "${input}" in "${doc.slug}".${didYouMean(wanted, ids)} Sections: ${ids.join(", ")}.`,
  );
}

function outline(doc: ParsedDoc): string {
  const intro = doc.sections[0];
  const headings = doc.sections.slice(1);
  const out = [`# ${doc.title}`, `${uriFor(doc.slug)} (slug "${doc.slug}")`];
  if (doc.frontmatter.importPath) out.push(`Import: ${doc.frontmatter.importPath}`);
  if (doc.frontmatter.since) out.push(`Since: ${doc.frontmatter.since}`);
  const text = trimBlankLines(doc.lines.slice(intro.start, intro.bodyEnd));
  if (text.length > 0) out.push("", ...text);
  if (headings.length > 0) {
    const top = Math.min(...headings.map((section) => section.level));
    out.push("", "Sections (call get_doc again with one of these ids as `section`):");
    for (const section of headings) {
      out.push(`${"  ".repeat(section.level - top)}- ${section.id}: ${section.heading}`);
    }
  }
  return out.join("\n");
}

/**
 * One docs page for an agent. With only a slug: the page's intro and the list of its
 * sections. With a section id (or its heading text): that section with its subsections.
 * A `#fragment` on the slug names the section when `section` is not given.
 */
export async function getDoc(args: GetDocArgs): Promise<string> {
  const reference = (args.slug ?? "").trim();
  if (!reference) throw new Error("`slug` must be a non-empty string.");
  const docs = await loadCorpus();
  const slugs = docs.map((doc) => doc.slug);
  const slug = matchSlug(reference, slugs);
  const doc = docs.find((entry) => entry.slug === slug);
  if (!doc) {
    const { name } = splitReference(reference);
    throw new Error(
      `No VaneUI doc "${reference}".${didYouMean(name, slugs)} Pages: ${slugs.join(", ")}. search_docs finds the page for a topic.`,
    );
  }

  const wanted = args.section?.trim() || splitReference(reference).fragment;
  if (!wanted) return outline(doc);
  const section = findSection(doc, wanted);
  if (section.id === INTRO_SECTION) return outline(doc);
  const path = [doc.title, ...section.parents, section.heading].join(" > ");
  const body = trimBlankLines(doc.lines.slice(section.start, section.end));
  return [`${path} (slug "${doc.slug}", section "${section.id}")`, "", ...body].join("\n");
}
