import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { RESOURCES_DIR } from "./resources.js";
import { didYouMean, matchSlug, splitReference } from "./slugs.js";

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

/**
 * The slug a caller means: `common` or a component of the index. Case, separators, a
 * `.md` ending and a path before the name are ignored, as in get_doc.
 */
function resolveSlug(input: string, index: ComponentPropsIndex): string {
  const slug = (input ?? "").trim();
  if (!slug) {
    throw new Error("`slug` must be a non-empty string.");
  }
  const known = [COMMON_SLUG, ...Object.keys(index).sort()];
  const match = matchSlug(slug, known);
  if (match) return match;
  const close = didYouMean(splitReference(slug).name, known);
  throw new Error(`Unknown component slug "${slug}".${close} Known slugs: ${known.join(", ")}.`);
}

export async function getComponentProps(
  args: GetComponentPropsArgs,
): Promise<ComponentPropRow[]> {
  const index = await loadComponentProps();
  const slug = resolveSlug(args.slug, index);
  return slug === COMMON_SLUG ? commonRows(index) : index[slug];
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
  const slug = resolveSlug(args.slug, await loadComponentProps());
  const rows = await getComponentProps({ slug });
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
