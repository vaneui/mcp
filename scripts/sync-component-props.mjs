#!/usr/bin/env node
// Builds resources/component-props.json: a structured prop / category /
// default / description snapshot for every documented component.
//
// Source of truth (all imported dynamically from the built `@vaneui/ui`
// sibling repo at ../vaneui/dist/esm/):
//   - ComponentCategories  -> which categories apply to a given component
//   - ComponentKeys        -> which props belong to a given category
//   - defaultTheme         -> which prop in a category is the default
//   - PropDescriptions     -> human-readable description per prop
//
// Component-key resolution: each component MD page in vaneui-web has a
// frontmatter `componentKey: <camelCaseKey>` line. We collect every MD under
// vaneui-web/app/docs/data/{basic,layout,navigation,overlay,typography}-components
// and map slug = filename-without-.md  ->  componentKey from frontmatter.
//
// Output: resources/component-props.json with shape
//   {
//     "<slug>": [
//       { prop, category, isDefault, description, isCommon },
//       ...
//     ],
//     ...
//   }
//
// Flags:
//   --strict   Exit 1 if vaneui or vaneui-web is missing, if vaneui's dist
//              hasn't been built, or if any frontmatter componentKey doesn't
//              exist in @vaneui/ui's ComponentCategories.
//
// Env:
//   VANEUI_PATH       Override the vaneui sibling location (default ../vaneui).
//   VANEUI_WEB_PATH   Override the vaneui-web sibling location (default ../vaneui-web).

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { readFile, readdir, access, writeFile, mkdir } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, "..");
const RESOURCES_DIR = join(PKG_ROOT, "resources");

const REPO_ROOT = process.env.VANEUI_PATH
  ? resolve(process.env.VANEUI_PATH)
  : resolve(PKG_ROOT, "..", "vaneui");
const WEB_ROOT = process.env.VANEUI_WEB_PATH
  ? resolve(process.env.VANEUI_WEB_PATH)
  : resolve(PKG_ROOT, "..", "vaneui-web");

const STRICT = process.argv.includes("--strict");

// Mirror of vaneui-web/app/docs/commonCategories.ts. Hard-coded here because
// the 26-element list rarely changes; if it does, update both files together.
const COMMON_DOC_CATEGORIES = new Set([
  "hide",
  "items",
  "justify",
  "position",
  "display",
  "overflow",
  "wrap",
  "gap",
  "flexDirection",
  "reverse",
  "border",
  "shadow",
  "ring",
  "focusVisible",
  "cursor",
  "transition",
  "whitespace",
  "width",
  "height",
  "transparent",
  "responsive",
  "objectFit",
  "blur",
  "pointerEvents",
  "minWidth",
  "maxHeight",
  "orientation",
]);

const COMPONENT_DIRS = [
  "basic-components",
  "layout-components",
  "navigation-components",
  "overlay-components",
  "typography-components",
];

async function pathExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function fail(msg) {
  if (STRICT) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
}

// Lightweight YAML frontmatter parser — only extracts simple `key: value` lines
// from the leading `---\n...\n---\n` block. Sufficient for our schema.
function parseFrontmatter(text) {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = text.slice(3, end).trim();
  const out = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*?)\s*$/);
    if (!m) continue;
    let value = m[2];
    // Strip surrounding quotes if any.
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

// Walk vaneui-web/app/docs/data/{component-dirs}/*.md and return an array of
// { slug, componentKey, srcPath } objects.
async function collectComponentMd(webRoot) {
  const result = [];
  const dataRoot = join(webRoot, "app", "docs", "data");
  for (const dir of COMPONENT_DIRS) {
    const full = join(dataRoot, dir);
    if (!(await pathExists(full))) continue;
    const entries = await readdir(full, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
      const srcPath = join(full, ent.name);
      const text = await readFile(srcPath, "utf8");
      const fm = parseFrontmatter(text);
      const componentKey = fm.componentKey;
      const slug = basename(ent.name, ".md").toLowerCase();
      if (!componentKey) {
        fail(`[sync-component-props] ${dir}/${ent.name}: missing 'componentKey' frontmatter — skipping`);
        continue;
      }
      result.push({ slug, componentKey, srcPath });
    }
  }
  return result.sort((a, b) => a.slug.localeCompare(b.slug));
}

// Mirror of getDefaults() in vaneui-web/app/docs/DocsPropsTable.tsx — handles
// compound components whose theme is split across sub-keys.
function getDefaults(themeNode) {
  if (!themeNode || typeof themeNode !== "object") return {};
  const candidates = [
    themeNode.main,
    themeNode.content,
    themeNode.root,
    themeNode.item,
    themeNode.input,
    themeNode, // direct ComponentTheme (badge, divider, container, ...)
  ];
  for (const c of candidates) {
    if (c && typeof c === "object" && "defaults" in c) {
      const d = c.defaults;
      if (d && typeof d === "object") return d;
    }
  }
  return {};
}

async function main() {
  if (!(await pathExists(REPO_ROOT))) {
    fail(`[sync-component-props] vaneui not found at ${REPO_ROOT}. Pass VANEUI_PATH or check out vaneui as a sibling repo.`);
    return;
  }
  if (!(await pathExists(WEB_ROOT))) {
    fail(`[sync-component-props] vaneui-web not found at ${WEB_ROOT}. Pass VANEUI_WEB_PATH or check out vaneui-web as a sibling repo.`);
    return;
  }

  // The `@vaneui/ui` package only exposes prop metadata via its built ESM
  // output. We import the explicit dist file rather than the package name so
  // the script works without npm-linking.
  const vaneuiEsm = join(REPO_ROOT, "dist", "esm", "index.mjs");
  const vaneuiPropsEsm = join(REPO_ROOT, "dist", "esm", "components", "ui", "props", "index.mjs");
  if (!(await pathExists(vaneuiEsm)) || !(await pathExists(vaneuiPropsEsm))) {
    fail(`[sync-component-props] vaneui dist not built. Expected ${vaneuiEsm} and ${vaneuiPropsEsm}. Run \`npm run build\` inside the vaneui repo first.`);
    return;
  }

  let mod, propsMod;
  try {
    mod = await import(pathToFileURL(vaneuiEsm).href);
    propsMod = await import(pathToFileURL(vaneuiPropsEsm).href);
  } catch (err) {
    fail(`[sync-component-props] failed to import @vaneui/ui dist: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const ComponentCategories = mod.ComponentCategories;
  const ComponentKeys = mod.ComponentKeys;
  const defaultTheme = mod.defaultTheme;
  const PropDescriptions = propsMod.PropDescriptions;

  if (!ComponentCategories || !ComponentKeys || !defaultTheme || !PropDescriptions) {
    fail(`[sync-component-props] @vaneui/ui dist is missing one of: ComponentCategories, ComponentKeys, defaultTheme, PropDescriptions.`);
    return;
  }

  const components = await collectComponentMd(WEB_ROOT);
  if (components.length === 0) {
    fail(`[sync-component-props] no component MD files found under vaneui-web.`);
    return;
  }

  const out = {};
  let totalRows = 0;
  for (const { slug, componentKey } of components) {
    const cats = ComponentCategories[componentKey];
    if (!cats) {
      fail(`[sync-component-props] ${slug}: componentKey '${componentKey}' not in ComponentCategories — skipping`);
      continue;
    }
    const themeNode = defaultTheme[componentKey];
    const defaults = getDefaults(themeNode);

    const rows = [];
    for (const catKey of cats) {
      const propKeys = ComponentKeys[catKey] ?? [];
      const catMeta = PropDescriptions[catKey];
      const categoryName = catMeta?.name ?? catKey;
      const propDescs = catMeta?.props ?? {};
      const isCommon = COMMON_DOC_CATEGORIES.has(catKey);
      for (const prop of propKeys) {
        rows.push({
          prop,
          category: categoryName,
          isDefault: defaults[prop] === true,
          description: propDescs[prop]?.description ?? "",
          isCommon,
        });
      }
    }
    out[slug] = rows;
    totalRows += rows.length;
  }

  if (!(await pathExists(RESOURCES_DIR))) {
    await mkdir(RESOURCES_DIR, { recursive: true });
  }
  const outPath = join(RESOURCES_DIR, "component-props.json");
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(
    `[sync-component-props] wrote ${Object.keys(out).length} components / ${totalRows} prop rows to resources/component-props.json`,
  );
}

main().catch((err) => {
  console.error("sync-component-props failed:", err);
  process.exit(1);
});
