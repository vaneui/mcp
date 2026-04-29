#!/usr/bin/env node
// Copies VaneUI markdown docs into mcp/resources/.
//
// Sources (both required — MD-first docs are now authored directly):
//   1. The sibling `vaneui/` repo (CLAUDE.md + .claude/rules/*.md) — API
//      reference and agent-facing rules.
//   2. The sibling `vaneui-web/` repo (app/docs/data/**.md) — narrative guides
//      AND per-component reference (one .md per component, with frontmatter).
//
// Each source MD file is copied verbatim into resources/ keyed by basename.
// Filenames are globally unique across categories, so the corpus is flat:
// `resources/button.md`, `resources/installation.md`, `resources/common-props.md`,
// etc. The MCP URI for each is `vaneui://docs/<basename-without-.md>`.
//
// Flags:
//   --strict   Exit 1 if any source root is missing OR if no MD files are
//              found in either source. Used by `prepublishOnly` so we never
//              ship a tarball with partial docs.
//
// Env:
//   VANEUI_PATH       Absolute or relative path to the vaneui checkout.
//                     Defaults to `../vaneui` (sibling of the vaneui-mcp repo).
//   VANEUI_WEB_PATH   Absolute or relative path to the vaneui-web checkout.
//                     Defaults to `../vaneui-web` (sibling of the vaneui-mcp repo).
//
// Run via: npm run sync  (lenient)  or  npm run sync:strict  (strict).
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { mkdir, copyFile, rm, readdir, access, stat } from "node:fs/promises";

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

// Recursively collect all *.md files under `dir`.
async function collectMd(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      const nested = await collectMd(full);
      out.push(...nested);
    } else if (ent.isFile() && ent.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

// Copy a list of source MD files into resources/. Detects duplicate basenames
// across the input list and aborts (in strict mode) so a silent overwrite never
// happens.
async function syncMd(rootLabel, files) {
  const seen = new Map(); // dest basename -> source path
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
    await copyFile(from, to);
    written++;
  }
  console.log(`[sync] ${rootLabel}: ${written} markdown files`);
  return written;
}

async function main() {
  // Start clean so removed source files don't linger in resources/.
  await rm(RESOURCES_DIR, { recursive: true, force: true });
  await mkdir(RESOURCES_DIR, { recursive: true });

  // Source 1: sibling vaneui repo. CLAUDE.md + .claude/rules/*.md.
  if (!(await pathExists(REPO_ROOT))) {
    fail(`[sync] vaneui not found at ${REPO_ROOT}. Pass VANEUI_PATH or check out vaneui as a sibling repo.`);
  }
  const vaneuiClaude = join(REPO_ROOT, "CLAUDE.md");
  const vaneuiRulesDir = join(REPO_ROOT, ".claude", "rules");
  const vaneuiFiles = [];
  if (await pathExists(vaneuiClaude)) {
    vaneuiFiles.push(vaneuiClaude);
  } else {
    fail(`[sync] vaneui: missing CLAUDE.md at ${vaneuiClaude}`);
  }
  if (await pathExists(vaneuiRulesDir)) {
    const rules = (await collectMd(vaneuiRulesDir)).sort();
    vaneuiFiles.push(...rules);
  } else {
    fail(`[sync] vaneui: missing rules dir at ${vaneuiRulesDir}`);
  }
  if (vaneuiFiles.length === 0) {
    fail(`[sync] vaneui: no markdown files found`);
  }
  const wroteVaneui = await syncMd("vaneui", vaneuiFiles);

  // Source 2: sibling vaneui-web repo. app/docs/data/**/*.md.
  if (!(await pathExists(WEB_ROOT))) {
    fail(`[sync] vaneui-web not found at ${WEB_ROOT}. Pass VANEUI_WEB_PATH or check out vaneui-web as a sibling repo.`);
  }
  const webDocsRoot = join(WEB_ROOT, "app", "docs", "data");
  if (!(await pathExists(webDocsRoot))) {
    fail(`[sync] vaneui-web: missing docs root at ${webDocsRoot}`);
  }
  const webFiles = (await collectMd(webDocsRoot)).sort();
  if (webFiles.length === 0) {
    fail(`[sync] vaneui-web: no markdown files found under ${webDocsRoot}`);
  }
  const wroteWeb = await syncMd("vaneui-web", webFiles);

  const entries = await readdir(RESOURCES_DIR);
  const total = wroteVaneui + wroteWeb;
  console.log(`[sync] wrote ${total} files to resources/ (${entries.length} present)`);
}

main().catch((err) => {
  console.error("sync-docs failed:", err);
  process.exit(1);
});
