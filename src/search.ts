import { loadCorpus, type DocSection, type ParsedDoc } from "./docs.js";
import { uriFor } from "./resources.js";

/** results returned when the caller gives no `limit` */
export const DEFAULT_LIMIT = 10;
/** the largest `limit` a caller may ask for */
export const MAX_RESULTS = 50;
/** sections of one page in a result list, so one long page cannot fill it */
export const MAX_PER_PAGE = 3;
/** snippet radius around the match, in characters */
const SNIPPET_RADIUS = 80;

export interface SearchHit {
  uri: string;
  slug: string;
  /** section id: pass it with `slug` to get_doc */
  section: string;
  heading: string;
  lineNumber: number;
  snippet: string;
}

export interface SearchArgs {
  query: string;
  regex?: boolean;
  limit?: number;
}

export interface SearchResult {
  /** best first */
  hits: SearchHit[];
  /** sections that matched, before the per-page and `limit` cuts */
  total: number;
}

interface IndexedSection {
  doc: ParsedDoc;
  section: DocSection;
  /** position in the corpus: pages by slug, sections in page order */
  order: number;
  isIntro: boolean;
  /** the fields below are lowercased with whitespace collapsed */
  title: string;
  heading: string;
  parents: string;
  body: string;
}

interface Match {
  entry: IndexedSection;
  score: number;
  /** every word of the query was found in the section or its page title and parent headings */
  complete: boolean;
}

/** Where on a line the query matches, and how well (higher is better). */
interface LineMatch {
  start: number;
  end: number;
  rank: number;
}

interface Matcher {
  score(entry: IndexedSection): Omit<Match, "entry"> | null;
  locate(line: string): LineMatch | null;
}

const lower = (text: string): string => text.replace(/\s+/g, " ").trim().toLowerCase();
const compact = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, "");
const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let index: Promise<IndexedSection[]> | null = null;

function loadIndex(): Promise<IndexedSection[]> {
  index ??= loadCorpus().then((docs) => {
    const entries: IndexedSection[] = [];
    for (const doc of docs) {
      const title = lower(`${doc.slug} ${doc.slug.replace(/-/g, " ")} ${doc.title}`);
      doc.sections.forEach((section, n) => {
        const isIntro = n === 0;
        entries.push({
          doc,
          section,
          order: entries.length,
          isIntro,
          title,
          heading: isIntro ? "" : lower(section.heading),
          parents: lower(section.parents.join(" ")),
          body: lower(doc.lines.slice(isIntro ? section.start : section.start + 1, section.bodyEnd).join(" ")),
        });
      });
    }
    return entries;
  });
  return index;
}

// Words that say nothing about the topic. `vaneui` is one here: every page is about it.
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from", "how", "i", "in", "is",
  "it", "my", "of", "on", "or", "should", "that", "the", "this", "to", "vaneui", "what", "when", "where",
  "which", "why", "with",
]);

/**
 * Cuts a plain English word back to the part its other forms share, so `defaults` finds
 * `default` and `trapping` finds `traps`. Identifiers (`themeDefaults`, `--fs-unit`) are
 * never passed here.
 */
function stem(word: string): string {
  if (word.length < 5) return word;
  let base = word;
  if (/(ing|ed)$/.test(word)) {
    base = word.replace(/(ing|ed)$/, "");
    // trapping -> trapp -> trap
    if (/([^aeiou])\1$/.test(base)) base = base.slice(0, -1);
  } else if (/(ss|x|ch|sh)es$/.test(word)) base = word.slice(0, -2);
  else if (/s$/.test(word) && !/(ss|us|is)$/.test(word)) base = word.slice(0, -1);
  return base.length >= 4 ? base : word;
}

interface QueryWord {
  /** lowercased; a plain word is cut to its stem */
  text: string;
  /** an English word, not an identifier such as `themeDefaults` or `--fs-unit` */
  plain: boolean;
}

function queryWords(query: string): QueryWord[] {
  const words = query
    .split(/\s+/)
    .map((word) => word.replace(/^[\s"'`([{<,.;:!?]+|[\s"'`)\]}>,.;:!?/()]+$/g, ""))
    .filter(Boolean);
  const kept = words.filter((word) => !STOPWORDS.has(word.toLowerCase()));
  const seen = new Set<string>();
  const out: QueryWord[] = [];
  for (const word of kept.length > 0 ? kept : words) {
    const plain = /^[A-Za-z][a-z]+$/.test(word);
    const text = plain ? stem(word.toLowerCase()) : word.toLowerCase();
    if (!seen.has(text)) out.push({ text, plain });
    seen.add(text);
  }
  return out.length > 0 ? out : [{ text: lower(query), plain: false }];
}

/** The words of a query to look for: lowercased, without stop words and edge punctuation. */
export function queryTerms(query: string): string[] {
  return queryWords(query).map((word) => word.text);
}

function count(haystack: string, needle: string, max: number): number {
  let found = 0;
  for (let at = haystack.indexOf(needle); at !== -1 && found < max; at = haystack.indexOf(needle, at + needle.length)) {
    found++;
  }
  return found;
}

/**
 * Ranks sections for a plain-text query. Each word counts by where it is found: the
 * section heading most, then the page title, the parent headings and the section text.
 * Rare words weigh more than common ones, and a query found as a whole phrase adds to
 * the score.
 */
function termMatcher(query: string, entries: IndexedSection[]): Matcher {
  const phrase = lower(query.replace(/^["'`\s]+|["'`\s]+$/g, ""));
  const queryKey = compact(query);
  const terms = queryWords(query).map(({ text, plain }) => {
    const containing = entries.filter((entry) => entry.heading.includes(text) || entry.body.includes(text)).length;
    return {
      text,
      key: compact(text),
      // A stem matches the start of a word (`size` in "Sizes"); a name matches a whole word.
      word: new RegExp(`(^|[^a-z0-9])${escapeRegex(text)}${plain ? "" : "($|[^a-z0-9])"}`),
      weight: Math.log(1 + entries.length / (1 + containing)),
    };
  });
  type Term = (typeof terms)[number];
  const totalWeight = terms.reduce((sum, term) => sum + term.weight, 0);

  // 1 for a whole word, 0.6 inside a longer word or across words (`themeDefaults` in "Theme defaults").
  const inText = (text: string, term: Term): number => {
    if (term.word.test(text)) return 1;
    if (text.includes(term.text)) return 0.6;
    return term.key.length >= 5 && compact(text).includes(term.key) ? 0.6 : 0;
  };
  // The page whose slug is the query itself ranks above pages that only contain the word.
  const isPage = (entry: IndexedSection, term: Term): boolean => {
    const slugKey = compact(entry.doc.slug);
    return slugKey === queryKey || slugKey === term.key;
  };
  const inTitle = (entry: IndexedSection, term: Term): number =>
    isPage(entry, term) ? 1.5 : inText(entry.title, term);

  return {
    score(entry) {
      let score = 0;
      let own = false;
      let complete = true;
      for (const term of terms) {
        const title = inTitle(entry, term);
        // The intro stands for the page: a query that names the page finds it as a heading.
        const heading = entry.isIntro ? (isPage(entry, term) ? title : 0) : inText(entry.heading, term);
        const parents = inText(entry.parents, term);
        const hits = count(entry.body, term.text, 5);
        const body = hits > 0 ? 1 + 0.25 * (hits - 1) : 0;
        if (heading > 0 || body > 0) own = true;
        if (title === 0 && heading === 0 && parents === 0 && body === 0) complete = false;
        score += term.weight * (4 * heading + 3 * title + parents + body);
      }
      if (!own) return null;
      if (terms.length > 1 || phrase !== terms[0].text) {
        if (entry.heading.includes(phrase)) score += 2 * totalWeight;
        else if (entry.body.includes(phrase)) score += totalWeight;
      }
      return { score, complete };
    },
    locate(line) {
      const text = line.toLowerCase();
      if (terms.length > 1) {
        const at = text.indexOf(phrase);
        if (at !== -1) return { start: at, end: at + phrase.length, rank: totalWeight + 1 };
      }
      // The line with the most (and rarest) words of the query, shown from its first match.
      let best: LineMatch | null = null;
      for (const term of terms) {
        const start = text.indexOf(term.text);
        if (start === -1) continue;
        const end = start + term.text.length;
        if (!best) best = { start, end, rank: term.weight };
        else if (start < best.start) best = { start, end, rank: best.rank + term.weight };
        else best.rank += term.weight;
      }
      return best;
    },
  };
}

/** Ranks sections for a regular expression: a match in the heading, then the page title, then the text. */
function regexMatcher(pattern: RegExp): Matcher {
  const matches = (text: string, max: number): number => {
    let found = 0;
    pattern.lastIndex = 0;
    for (let m = pattern.exec(text); m && found < max; m = pattern.exec(text)) {
      found++;
      if (m[0].length === 0) pattern.lastIndex++;
    }
    return found;
  };
  return {
    score(entry) {
      const title = matches(entry.doc.slug, 1) || matches(entry.doc.title, 1);
      // The heading is matched as written, `## ` included, so `^## Sizes` finds it.
      const heading = entry.isIntro ? title : matches(entry.doc.lines[entry.section.start], 1);
      const first = entry.isIntro ? entry.section.start : entry.section.start + 1;
      let hits = 0;
      for (const line of entry.doc.lines.slice(first, entry.section.bodyEnd)) {
        hits += matches(line, 5 - hits);
        if (hits >= 5) break;
      }
      if (heading === 0 && hits === 0) return null;
      return { score: 4 * heading + 3 * title + (hits > 0 ? 1 + 0.25 * (hits - 1) : 0), complete: true };
    },
    locate(line) {
      pattern.lastIndex = 0;
      const m = pattern.exec(line);
      return m && m[0].length > 0 ? { start: m.index, end: m.index + m[0].length, rank: 1 } : null;
    },
  };
}

function snippetAround(line: string, matchStart: number, matchEnd: number): string {
  const start = Math.max(0, matchStart - SNIPPET_RADIUS);
  const end = Math.min(line.length, matchEnd + SNIPPET_RADIUS);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < line.length ? "..." : "";
  return (prefix + line.slice(start, end) + suffix).replace(/\s+/g, " ").trim();
}

/** The line of the section that shows the match best, or its first line of text when only the heading matched. */
function toHit(entry: IndexedSection, matcher: Matcher): SearchHit {
  const { doc, section } = entry;
  const first = entry.isIntro ? section.start : section.start + 1;
  let lineIndex = -1;
  let found: LineMatch | null = null;
  for (let i = first; i < section.bodyEnd; i++) {
    const match = matcher.locate(doc.lines[i]);
    if (match && (!found || match.rank > found.rank)) {
      found = match;
      lineIndex = i;
    }
  }
  if (!found) {
    for (let i = first; i < section.bodyEnd && lineIndex === -1; i++) {
      if (/[A-Za-z0-9]/.test(doc.lines[i]) && !/^\s*(```|~~~)/.test(doc.lines[i])) lineIndex = i;
    }
  }
  const line = lineIndex === -1 ? section.heading : doc.lines[lineIndex];
  return {
    uri: uriFor(doc.slug),
    slug: doc.slug,
    section: section.id,
    heading: section.heading,
    lineNumber: (lineIndex === -1 ? Math.min(section.start, doc.lines.length - 1) : lineIndex) + 1,
    snippet: found ? snippetAround(line, found.start, found.end) : snippetAround(line, 0, 0),
  };
}

/**
 * Searches the corpus section by section and returns the best matches first: sections
 * that hold every word of the query before sections that hold some, then by score, then
 * in corpus order. At most `MAX_PER_PAGE` sections of one page are returned.
 */
export async function searchDocs(args: SearchArgs): Promise<SearchResult> {
  const query = (args.query ?? "").trim();
  if (!query) {
    throw new Error("`query` must be a non-empty string.");
  }
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, 1), MAX_RESULTS);
  const entries = await loadIndex();

  let matcher: Matcher;
  if (args.regex === true) {
    try {
      // "g" so every match in a section is counted, "i" for case-insensitive.
      matcher = regexMatcher(new RegExp(query, "gi"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid regex: ${msg}`);
    }
  } else {
    matcher = termMatcher(query, entries);
  }

  const matched: Match[] = [];
  for (const entry of entries) {
    const result = matcher.score(entry);
    if (result) matched.push({ entry, ...result });
  }
  matched.sort(
    (a, b) => Number(b.complete) - Number(a.complete) || b.score - a.score || a.entry.order - b.entry.order,
  );

  const hits: SearchHit[] = [];
  const perPage = new Map<string, number>();
  for (const { entry } of matched) {
    if (hits.length >= limit) break;
    const taken = perPage.get(entry.doc.slug) ?? 0;
    if (taken >= MAX_PER_PAGE) continue;
    perPage.set(entry.doc.slug, taken + 1);
    hits.push(toHit(entry, matcher));
  }
  return { hits, total: matched.length };
}
