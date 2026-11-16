// Which pages of a docs component directory describe a component.
//
// A component page opens with a frontmatter block that names its `componentKey`. A guide
// that lives beside the component pages (form-components/forms.md) has no frontmatter: it
// documents no single component, so there are no props to extract from it. A page that has
// frontmatter but no `componentKey` is a component page with the line left out, and the
// sync reports it.

/**
 * Lightweight YAML frontmatter parser: the simple `key: value` lines of the leading
 * `---\n...\n---\n` block. Sufficient for the docs pages' schema.
 */
export function parseFrontmatter(text: string): Record<string, string> {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = text.slice(3, end).trim();
  const out: Record<string, string> = {};
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

export type ComponentDirPage =
  | { kind: "component"; componentKey: string }
  | { kind: "guide" }
  | { kind: "missing-key" };

/** What a Markdown page found in a component directory is, read from its frontmatter. */
export function classifyComponentDirPage(text: string): ComponentDirPage {
  const frontmatter = parseFrontmatter(text);
  if (frontmatter.componentKey) {
    return { kind: "component", componentKey: frontmatter.componentKey };
  }
  return Object.keys(frontmatter).length === 0 ? { kind: "guide" } : { kind: "missing-key" };
}
