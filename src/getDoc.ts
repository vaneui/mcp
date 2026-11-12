import { INTRO_SECTION, headingText, loadCorpus, slugifyHeading, type DocSection, type ParsedDoc } from "./docs.js";
import { uriFor } from "./resources.js";
import { didYouMean, matchSlug, splitReference } from "./slugs.js";

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
