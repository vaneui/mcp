import { DOCS, readDoc } from "./resources.js";

/** Section id for the text before a page's first heading */
export const INTRO_SECTION = "intro";

export interface DocSection {
  /** unique within the page, slugged from the heading; `intro` for the text before the first heading */
  id: string;
  /** heading as plain text; the page title for the intro */
  heading: string;
  /** 0 for the intro, otherwise the heading level (1 to 6) */
  level: number;
  /** headings of the sections that contain this one, outermost first */
  parents: string[];
  /** index into `lines` of the heading line (of the first line, for the intro) */
  start: number;
  /** index after the section's own text, where its first subsection or the next section starts */
  bodyEnd: number;
  /** index after the section and its subsections */
  end: number;
}

export interface ParsedDoc {
  slug: string;
  title: string;
  /** simple `key: value` pairs of the leading `---` block; other lines of the block are ignored */
  frontmatter: Record<string, string>;
  /** every line of the file, so an index plus one is a line number in the resource */
  lines: string[];
  /** the intro first, then every heading in document order */
  sections: DocSection[];
}

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;

/** The text a reader sees for a heading: no link targets, backticks or emphasis marks. */
export function headingText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(`+)(.+?)\1/g, "$2")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/\\([\\`*_{}[\]()#+\-.!|<>])/g, "$1")
    .trim();
}

/**
 * Heading text to a section id. It gives the same ids as the anchors on vaneui.com, so the
 * fragment of a docs link (`/docs/layout-components/card#strong-border-for-a-selected-card`)
 * names a section here too.
 */
export function slugifyHeading(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return /^[a-z]/.test(base) ? base : `id-${base || "x"}`;
}

function parseFrontmatter(lines: string[]): { frontmatter: Record<string, string>; bodyStart: number } {
  const frontmatter: Record<string, string> = {};
  if (lines[0]?.trim() !== "---") return { frontmatter, bodyStart: 0 };
  const close = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (close === -1) return { frontmatter, bodyStart: 0 };
  for (const line of lines.slice(1, close)) {
    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.+?)\s*$/.exec(line);
    if (!pair) continue;
    const quoted = /^(['"])(.*)\1$/.exec(pair[2]);
    frontmatter[pair[1]] = quoted ? quoted[2] : pair[2];
  }
  return { frontmatter, bodyStart: close + 1 };
}

const isBlank = (lines: string[], from: number, to: number): boolean =>
  lines.slice(from, to).every((line) => line.trim() === "");

/** Splits one markdown page into its intro and heading sections. Headings inside code fences are text. */
export function parseDoc(slug: string, fallbackTitle: string, text: string): ParsedDoc {
  const lines = text.split(/\r?\n/);
  const { frontmatter, bodyStart } = parseFrontmatter(lines);

  const headings: { index: number; level: number; text: string }[] = [];
  let fence: string | null = null;
  for (let i = bodyStart; i < lines.length; i++) {
    const marker = FENCE.exec(lines[i])?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    if (marker) {
      fence = marker;
      continue;
    }
    const heading = HEADING.exec(lines[i]);
    if (!heading) continue;
    const plain = headingText(heading[2]);
    if (plain) headings.push({ index: i, level: heading[1].length, text: plain });
  }

  // A level 1 heading that opens the page is its title, not a section: its text is the intro.
  let title = fallbackTitle;
  let introStart = bodyStart;
  const first = headings[0];
  if (first && first.level === 1 && isBlank(lines, bodyStart, first.index)) {
    title = first.text;
    introStart = first.index + 1;
    headings.shift();
  }

  const introEnd = headings[0]?.index ?? lines.length;
  const sections: DocSection[] = [
    { id: INTRO_SECTION, heading: title, level: 0, parents: [], start: introStart, bodyEnd: introEnd, end: introEnd },
  ];

  const used = new Map<string, number>([[INTRO_SECTION, 1]]);
  const open: DocSection[] = [];
  headings.forEach((heading, n) => {
    while (open.length > 0 && open[open.length - 1].level >= heading.level) open.pop();
    const base = slugifyHeading(heading.text);
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    const next = headings.slice(n + 1);
    const section: DocSection = {
      id: count === 1 ? base : `${base}-${count}`,
      heading: heading.text,
      level: heading.level,
      parents: open.map((parent) => parent.heading),
      start: heading.index,
      bodyEnd: next[0]?.index ?? lines.length,
      end: next.find((later) => later.level <= heading.level)?.index ?? lines.length,
    };
    sections.push(section);
    open.push(section);
  });

  return { slug, title, frontmatter, lines, sections };
}

let corpus: Promise<ParsedDoc[]> | null = null;

/** Every page of the corpus, parsed once per process. */
export function loadCorpus(): Promise<ParsedDoc[]> {
  corpus ??= Promise.all(
    DOCS.map(async (entry) => parseDoc(entry.slug, entry.name, await readDoc(entry))),
  );
  return corpus;
}
