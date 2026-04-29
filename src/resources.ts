import { readdirSync } from "node:fs";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

// dist/server.js -> dist/ -> package root -> resources/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const RESOURCES_DIR = resolve(__dirname, "..", "resources");

export interface DocEntry {
  /** slug used in the URI (e.g. "button") */
  slug: string;
  /** filename inside resources/ (e.g. "button.md") */
  file: string;
  /** human-readable label shown in MCP clients */
  name: string;
  /** tells the agent when to read this doc; may be empty */
  description: string;
}

// Convert a slug like "icon-button" or "common-props" to "Icon Button" /
// "Common Props". A slug like "claude" becomes "Claude". Numeric tails
// (grid2 -> "Grid2") are preserved.
function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(" ");
}

function loadDocsFromDisk(): DocEntry[] {
  let files: string[] = [];
  try {
    files = readdirSync(RESOURCES_DIR);
  } catch {
    // Resources dir missing — surface a clean empty list. ensureResourcesDir()
    // will produce a more helpful error when the server actually starts.
    return [];
  }
  return files
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      return {
        slug,
        file,
        name: titleCase(slug),
        description: "",
      };
    });
}

export const DOCS: DocEntry[] = loadDocsFromDisk();

export const URI_SCHEME = "vaneui";
export const URI_PREFIX = `${URI_SCHEME}://docs/`;

export function uriFor(slug: string): string {
  return `${URI_PREFIX}${slug}`;
}

export function slugFromUri(uri: string): string | null {
  if (!uri.startsWith(URI_PREFIX)) return null;
  return uri.slice(URI_PREFIX.length);
}

export function findDoc(slug: string): DocEntry | undefined {
  return DOCS.find((d) => d.slug === slug);
}

export async function ensureResourcesDir(): Promise<void> {
  try {
    await access(RESOURCES_DIR);
  } catch {
    throw new Error(
      `Resources directory not found at ${RESOURCES_DIR}. Run \`npm run sync\` (or \`npm run build\`) inside the @vaneui/mcp package to populate it.`,
    );
  }
}

export async function readDoc(entry: DocEntry): Promise<string> {
  const path = join(RESOURCES_DIR, entry.file);
  return readFile(path, "utf8");
}
