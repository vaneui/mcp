import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DOCS, RESOURCES_DIR, readDoc, uriFor, type DocEntry } from "./resources.js";

export const MAX_RESULTS = 50;
/** snippet radius around the match, in characters */
const SNIPPET_RADIUS = 80;

export interface SearchHit {
  uri: string;
  slug: string;
  lineNumber: number;
  snippet: string;
}

export interface SearchArgs {
  query: string;
  regex?: boolean;
}

function buildMatcher(query: string, regex: boolean): RegExp {
  if (regex) {
    // "g" so we can iterate all matches on a line, "i" for case-insensitive.
    return new RegExp(query, "gi");
  }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "gi");
}

function snippetAround(line: string, matchStart: number, matchEnd: number): string {
  const start = Math.max(0, matchStart - SNIPPET_RADIUS);
  const end = Math.min(line.length, matchEnd + SNIPPET_RADIUS);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < line.length ? "..." : "";
  return (prefix + line.slice(start, end) + suffix).replace(/\s+/g, " ").trim();
}

async function searchOne(entry: DocEntry, matcher: RegExp): Promise<SearchHit[]> {
  const text = await readDoc(entry);
  const lines = text.split(/\r?\n/);
  const hits: SearchHit[] = [];
  for (let i = 0; i < lines.length; i++) {
    matcher.lastIndex = 0;
    const line = lines[i];
    const m = matcher.exec(line);
    if (!m) continue;
    hits.push({
      uri: uriFor(entry.slug),
      slug: entry.slug,
      lineNumber: i + 1,
      snippet: snippetAround(line, m.index, m.index + m[0].length),
    });
  }
  return hits;
}

export async function searchDocs(args: SearchArgs): Promise<SearchHit[]> {
  const query = (args.query ?? "").trim();
  if (!query) {
    throw new Error("`query` must be a non-empty string.");
  }

  let matcher: RegExp;
  try {
    matcher = buildMatcher(query, args.regex === true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid regex: ${msg}`);
  }

  const results: SearchHit[] = [];
  for (const doc of DOCS) {
    const hits = await searchOne(doc, matcher);
    for (const h of hits) {
      results.push(h);
      if (results.length >= MAX_RESULTS) return results;
    }
  }
  return results;
}

export interface ComponentPropRow {
  prop: string;
  category: string;
  isDefault: boolean;
  description: string;
  isCommon: boolean;
}

type ComponentPropsIndex = Record<string, ComponentPropRow[]>;

let componentPropsCache: ComponentPropsIndex | null = null;

async function loadComponentProps(): Promise<ComponentPropsIndex> {
  if (componentPropsCache) return componentPropsCache;
  const path = join(RESOURCES_DIR, "component-props.json");
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `component-props.json not found at ${path} (${msg}). Run \`npm run sync\` to generate it.`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`component-props.json is not valid JSON: ${msg}`);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`component-props.json must be an object keyed by component slug.`);
  }
  componentPropsCache = parsed as ComponentPropsIndex;
  return componentPropsCache;
}

/** Slug that lists the shared layout props instead of one component's own props */
export const COMMON_SLUG = "common";

export type PropsDetail = "compact" | "full";

export interface GetComponentPropsArgs {
  slug: string;
  detail?: PropsDetail;
}

function knownSlugsError(slug: string, index: ComponentPropsIndex): Error {
  const known = [COMMON_SLUG, ...Object.keys(index).sort()].join(", ");
  return new Error(`Unknown component slug "${slug}". Known slugs: ${known}.`);
}

export async function getComponentProps(
  args: GetComponentPropsArgs,
): Promise<ComponentPropRow[]> {
  const slug = (args.slug ?? "").trim();
  if (!slug) {
    throw new Error("`slug` must be a non-empty string.");
  }
  const index = await loadComponentProps();
  if (slug === COMMON_SLUG) return commonRows(index);
  const rows = index[slug];
  if (!rows) throw knownSlugsError(slug, index);
  return rows;
}

/** One row per shared prop, in the order components first list them */
function commonRows(index: ComponentPropsIndex): ComponentPropRow[] {
  const seen = new Map<string, ComponentPropRow>();
  for (const rows of Object.values(index)) {
    for (const row of rows) {
      if (row.isCommon && !seen.has(row.prop)) seen.set(row.prop, { ...row, isDefault: false });
    }
  }
  return [...seen.values()];
}

function groupByCategory(rows: ComponentPropRow[]): Map<string, ComponentPropRow[]> {
  const groups = new Map<string, ComponentPropRow[]>();
  for (const row of rows) {
    const group = groups.get(row.category);
    if (group) group.push(row);
    else groups.set(row.category, [row]);
  }
  return groups;
}

const mark = (row: ComponentPropRow): string => (row.isDefault ? `${row.prop}*` : row.prop);

function formatGroups(rows: ComponentPropRow[], detail: PropsDetail): string[] {
  const lines: string[] = [];
  for (const [category, group] of groupByCategory(rows)) {
    if (detail === "compact") {
      lines.push(`${category}: ${group.map(mark).join(" ")}`);
    } else {
      lines.push(category);
      for (const row of group) lines.push(`  ${mark(row)}: ${row.description}`);
    }
  }
  return lines;
}

/**
 * Plain-text prop list for an agent. Each category is one line of alternatives with the
 * default marked `*`. Compact output leaves out descriptions and the shared layout props
 * that most components take: it names their categories and defaults instead.
 */
export async function formatComponentProps(args: GetComponentPropsArgs): Promise<string> {
  const detail: PropsDetail = args.detail ?? "compact";
  const rows = await getComponentProps(args);
  const slug = args.slug.trim();
  const more = detail === "compact" ? ` Descriptions: call again with detail "full".` : "";

  if (slug === COMMON_SLUG) {
    return [
      `Shared layout props, taken by most VaneUI components (each component's own list names the categories it takes). Props in one category are alternatives.${more}`,
      ...formatGroups(rows, detail),
    ].join("\n");
  }

  const own = rows.filter((row) => !row.isCommon);
  const shared = rows.filter((row) => row.isCommon);
  const lines = [
    `${slug} boolean props. Props in one category are alternatives; * marks the default.${more}`,
    ...formatGroups(detail === "compact" ? own : rows, detail),
  ];
  if (detail === "compact" && shared.length > 0) {
    const categories = [...groupByCategory(shared).keys()].join(", ");
    lines.push(`Shared layout props (get_component_props "${COMMON_SLUG}" lists them): ${categories}`);
    const defaults = shared.filter((row) => row.isDefault).map((row) => row.prop);
    if (defaults.length > 0) lines.push(`Shared defaults: ${defaults.join(" ")}`);
  }
  return lines.join("\n");
}
