#!/usr/bin/env node
// Copies VaneUI markdown docs into mcp/resources/.
//
// Sources (both required — MD-first docs are now authored directly):
//   1. The sibling `vaneui/` repo (CLAUDE.md + .claude/rules/*.md) — the parts
//      written for people who use the library: an allow-list of rule files
//      and of CLAUDE.md sections, kept in consumer-docs.ts.
//   2. The sibling `vaneui-web/` repo (app/docs/data/**.md) — narrative guides
//      AND per-component reference (one .md per component, with frontmatter).
//
// Each allow-listed vaneui rule file is copied verbatim into resources/ keyed
// by basename; CLAUDE.md keeps only its allow-listed sections. Rule files and
// sections that are not on the allow-list are left out and named in the log.
// Each vaneui-web page is written with its `{% include "x.md" %}` tags expanded
// through vaneui-web's own helper (lib/docs/includes.mjs, which needs that
// checkout's node_modules), so a resource holds the page as vaneui.com renders
// it. Files and directories whose name starts with `_` are partials that pages
// include, never pages, so they get no resource of their own.
// Filenames are globally unique across categories, so the corpus is flat:
// `resources/button.md`, `resources/installation.md`, `resources/common-props.md`,
// etc. The MCP URI for each is `vaneui://docs/<basename-without-.md>`.
//
// Flags:
//   --strict   Exit 1 if any source root is missing, if no MD files are
//              found in either source, or if an allow-listed rule file or
//              CLAUDE.md section is gone (renamed upstream). Used by
//              `prepublishOnly` so we never ship a tarball with partial docs.
//
// Env:
//   VANEUI_PATH       Absolute or relative path to the vaneui checkout.
//                     Defaults to `../vaneui` (sibling of the vaneui-mcp repo).
//   VANEUI_WEB_PATH   Absolute or relative path to the vaneui-web checkout.
//                     Defaults to `../vaneui-web` (sibling of the vaneui-mcp repo).
//
// Run via: npm run sync  (lenient)  or  npm run sync:strict  (strict). Node 24
// runs this TypeScript file directly (type stripping), no build step needed.
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { mkdir, copyFile, rm, readdir, access, writeFile } from "node:fs/promises";
import { readFileSync, type Dirent } from "node:fs";
import { CONSUMER_CLAUDE_SECTIONS, CONSUMER_RULE_FILES, keepSections, selectFiles } from "./consumer-docs.ts";

// The part of vaneui-web's lib/docs/includes.mjs this script calls. It returns
// null when the file does not exist.
interface IncludesHelper {
  readDocMarkdown(file: string, options: { dataDir: string }): string | null;
}

// Returns the text a resource gets for one source markdown file.
type ReadMarkdown = (file: string) => string;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, "..");

const REPO_ROOT = process.env.VANEUI_PATH
  ? resolve(process.env.VANEUI_PATH)
  : resolve(PKG_ROOT, "..", "vaneui");
const WEB_ROOT = process.env.VANEUI_WEB_PATH
  ? resolve(process.env.VANEUI_WEB_PATH)
  : resolve(PKG_ROOT, "..", "vaneui-web");

const RESOURCES_DIR = join(PKG_ROOT, "resources");

const STRICT = process.argv.includes("--strict");

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function fail(msg: string): void {
  if (STRICT) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
}

// Recursively collect all *.md files under `dir`. With `skipPartials`, files
// and directories whose name starts with `_` are left out.
async function collectMd(dir: string, { skipPartials = false }: { skipPartials?: boolean } = {}): Promise<string[]> {
  const out: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (skipPartials && ent.name.startsWith("_")) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      const nested = await collectMd(full, { skipPartials });
      out.push(...nested);
    } else if (ent.isFile() && ent.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

// Copy a list of source MD files into resources/. Detects duplicate basenames
// across the input list and aborts (in strict mode) so a silent overwrite never
// happens. With `read`, each file's text comes from `read(path)` instead of a
// plain copy.
async function syncMd(rootLabel: string, files: string[], read?: ReadMarkdown): Promise<number> {
  const seen = new Map<string, string>(); // dest basename -> source path
  let written = 0;
  for (const from of files) {
    // Lowercase the basename so URI slugs are uniform (CLAUDE.md -> claude.md).
    const dest = basename(from).toLowerCase();
    if (seen.has(dest)) {
      const msg = `[sync] ${rootLabel}: duplicate basename ${dest} (${seen.get(dest)} vs ${from})`;
      fail(msg);
      continue;
    }
    seen.set(dest, from);
    const to = join(RESOURCES_DIR, dest);
    if (read) await writeFile(to, read(from));
    else await copyFile(from, to);
    written++;
  }
  console.log(`[sync] ${rootLabel}: ${written} markdown files`);
  return written;
}

async function main(): Promise<void> {
  // Start clean so removed source files don't linger in resources/.
  await rm(RESOURCES_DIR, { recursive: true, force: true });
  await mkdir(RESOURCES_DIR, { recursive: true });

  // Source 1: sibling vaneui repo. CLAUDE.md + .claude/rules/*.md.
  if (!(await pathExists(REPO_ROOT))) {
    fail(`[sync] vaneui not found at ${REPO_ROOT}. Pass VANEUI_PATH or check out vaneui as a sibling repo.`);
  }
  const vaneuiClaude = join(REPO_ROOT, "CLAUDE.md");
  const vaneuiRulesDir = join(REPO_ROOT, ".claude", "rules");
  const vaneuiFiles: string[] = [];
  if (await pathExists(vaneuiClaude)) {
    vaneuiFiles.push(vaneuiClaude);
  } else {
    fail(`[sync] vaneui: missing CLAUDE.md at ${vaneuiClaude}`);
  }
  if (await pathExists(vaneuiRulesDir)) {
    const rules = selectFiles((await collectMd(vaneuiRulesDir)).sort(), CONSUMER_RULE_FILES);
    for (const file of rules.missing) {
      fail(`[sync] vaneui: ${file} is on the allow-list but not in ${vaneuiRulesDir}. If it was renamed, update scripts/consumer-docs.ts.`);
    }
    if (rules.skipped.length > 0) {
      console.log(`[sync] vaneui: left out rule files that are not on the allow-list: ${rules.skipped.map((file) => basename(file)).join(", ")}`);
    }
    vaneuiFiles.push(...rules.kept);
  } else {
    fail(`[sync] vaneui: missing rules dir at ${vaneuiRulesDir}`);
  }
  if (vaneuiFiles.length === 0) {
    fail(`[sync] vaneui: no markdown files found`);
  }
  const readVaneui: ReadMarkdown = (file) => {
    const text = readFileSync(file, "utf8");
    if (file !== vaneuiClaude) return text;
    const sections = keepSections(text, CONSUMER_CLAUDE_SECTIONS);
    for (const title of sections.missing) {
      fail(`[sync] vaneui: CLAUDE.md has no "## ${title}" section, which is on the allow-list. If it was renamed, update scripts/consumer-docs.ts.`);
    }
    if (sections.dropped.length > 0) {
      console.log(`[sync] vaneui: left out CLAUDE.md sections that are not on the allow-list: ${sections.dropped.join(", ")}`);
    }
    return sections.text;
  };
  const wroteVaneui = await syncMd("vaneui", vaneuiFiles, readVaneui);

  // Source 2: sibling vaneui-web repo. app/docs/data/**/*.md.
  if (!(await pathExists(WEB_ROOT))) {
    fail(`[sync] vaneui-web not found at ${WEB_ROOT}. Pass VANEUI_WEB_PATH or check out vaneui-web as a sibling repo.`);
  }
  const webDocsRoot = join(WEB_ROOT, "app", "docs", "data");
  if (!(await pathExists(webDocsRoot))) {
    fail(`[sync] vaneui-web: missing docs root at ${webDocsRoot}`);
  }
  const webFiles = (await collectMd(webDocsRoot, { skipPartials: true })).sort();
  if (webFiles.length === 0) {
    fail(`[sync] vaneui-web: no markdown files found under ${webDocsRoot}`);
  }
  // vaneui-web's include helper resolves @vaneui/md/include from its own
  // node_modules. A missing include throws, which stops the sync.
  const includesHelper = join(WEB_ROOT, "lib", "docs", "includes.mjs");
  let readPage: ReadMarkdown | undefined;
  if (await pathExists(includesHelper)) {
    const { readDocMarkdown }: IncludesHelper = await import(pathToFileURL(includesHelper).href);
    readPage = (file) => {
      const text = readDocMarkdown(file, { dataDir: webDocsRoot });
      if (text === null) throw new Error(`[sync] vaneui-web: ${file} disappeared during the sync`);
      return text;
    };
  } else {
    fail(`[sync] vaneui-web: missing ${includesHelper}; pages are copied without expanding their includes`);
  }
  const wroteWeb = await syncMd("vaneui-web", webFiles, readPage);

  const entries = await readdir(RESOURCES_DIR);
  const total = wroteVaneui + wroteWeb;
  console.log(`[sync] wrote ${total} files to resources/ (${entries.length} present)`);
}

main().catch((err) => {
  console.error("sync-docs failed:", err);
  process.exit(1);
});
