// What the sync ships from the vaneui repo (vaneui/vaneui).
//
// That repo's CLAUDE.md and .claude/rules/ are written for people and agents who work on
// the library itself. Most of it (the verification pipeline, the release policy, the test
// and playground conventions, the theme internals) would steer an agent in a project that
// only uses VaneUI, so the sync ships an allow-list: the files and the CLAUDE.md sections
// named here and nothing else. A new rule file or CLAUDE.md section stays out of the
// corpus until it is added below. test/sync.test.ts checks both the filter and the
// committed corpus.

/** Files in `.claude/rules/` that describe how to use the library. */
export const CONSUMER_RULE_FILES: readonly string[] = ["component-usage.md", "prop-to-tailwind-mapping.md"];

/** `## ` sections of CLAUDE.md that describe the library to the people who use it. */
export const CONSUMER_CLAUDE_SECTIONS: readonly string[] = [
  "Project Overview",
  "Component Inventory",
  "Prop System (Boolean Flags)",
  "Key Defaults (Do NOT Redundantly Specify)",
  "Exports",
];

export interface FilteredSections {
  /** the text before the first `## ` heading, then the allowed sections in document order */
  text: string;
  /** titles of the sections left out */
  dropped: string[];
  /** allowed titles the text does not have */
  missing: string[];
}

/**
 * Keeps the `## ` sections of a markdown text whose title is in `allowed`, and the text
 * before the first one (the title). A section runs to the next `## ` heading outside a
 * code fence, so its `### ` subsections stay with it.
 */
export function keepSections(text: string, allowed: readonly string[]): FilteredSections {
  const out: string[] = [];
  const found = new Set<string>();
  const dropped: string[] = [];
  let keep = true;
  let fence: string | null = null;
  for (const line of text.split("\n")) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
    } else if (marker) {
      fence = marker;
    } else {
      const heading = /^## (.+?)\s*$/.exec(line);
      if (heading) {
        keep = allowed.includes(heading[1]);
        if (keep) found.add(heading[1]);
        else dropped.push(heading[1]);
      }
    }
    if (keep) out.push(line);
  }
  // A kept section can end with the `---` rule that set off the section after it.
  while (out.length > 0 && /^(\s*|-{3,})$/.test(out[out.length - 1])) out.pop();
  return {
    text: out.join("\n") + "\n",
    dropped,
    missing: allowed.filter((title) => !found.has(title)),
  };
}

export interface SelectedFiles {
  /** paths whose file name is on the allow-list */
  kept: string[];
  /** paths left out */
  skipped: string[];
  /** allowed file names that are not among the paths */
  missing: string[];
}

/** Splits markdown paths into the ones whose file name is in `allowed` and the rest. */
export function selectFiles(paths: readonly string[], allowed: readonly string[]): SelectedFiles {
  const name = (path: string): string => path.slice(path.replace(/\\/g, "/").lastIndexOf("/") + 1).toLowerCase();
  const kept = paths.filter((path) => allowed.includes(name(path)));
  return {
    kept,
    skipped: paths.filter((path) => !kept.includes(path)),
    missing: allowed.filter((file) => !kept.some((path) => name(path) === file)),
  };
}
