// Tolerant matching of the names a caller passes for a docs page or a component.

/** Letters and digits only, so `IconButton`, `icon-button` and `Icon_Button` compare equal. */
function compactKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * What a caller may pass for a page: a slug, a file name, a resource URI or a docs link.
 * Keeps the last path segment without its `.md`, and the fragment if there is one.
 */
export function splitReference(input: string): { name: string; fragment?: string } {
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

export function didYouMean(input: string, known: readonly string[]): string {
  const close = suggest(input, known);
  return close.length > 0 ? ` Did you mean: ${close.join(", ")}?` : "";
}
