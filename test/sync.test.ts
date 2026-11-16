// The sync ships an allow-list of the vaneui repo's agent files. These tests cover the
// filter (scripts/consumer-docs.ts, run as TypeScript) and the corpus committed in
// resources/, so contributor material cannot reach the package unnoticed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import type * as ConsumerDocs from "../scripts/consumer-docs.js";

const { CONSUMER_CLAUDE_SECTIONS, CONSUMER_RULE_FILES, keepSections, selectFiles }: typeof ConsumerDocs = await import(
  new URL("../scripts/consumer-docs.ts", import.meta.url).href
);

const resourcesDir = new URL("../resources/", import.meta.url);
const read = (file: string): string => readFileSync(new URL(file, resourcesDir), "utf8");
const pages = readdirSync(resourcesDir).filter((file) => file.endsWith(".md"));

/** Headings of one level, outside code fences. */
function headings(text: string, level: number): string[] {
  const out: string[] = [];
  let inFence = false;
  for (const line of text.split("\n")) {
    if (/^\s{0,3}(```|~~~)/.test(line)) inFence = !inFence;
    const heading = !inFence && new RegExp(`^#{${level}} (.+?)\\s*$`).exec(line);
    if (heading) out.push(heading[1]);
  }
  return out;
}

const source = [
  "# CLAUDE.md",
  "",
  "## Project Overview",
  "A component library.",
  "",
  "## Release Policy",
  "Push `main:prod` to publish.",
  "",
  "```md",
  "## Exports",
  "```",
  "",
  "## Exports",
  "- `@vaneui/ui`",
  "",
  "### Subpaths",
  "- `@vaneui/ui/css`",
  "",
  "---",
  "",
  "## A Section Added Later",
  "Not classified yet.",
  "",
].join("\n");

test("only allow-listed sections of CLAUDE.md are kept, with their subsections", () => {
  const { text, dropped, missing } = keepSections(source, ["Project Overview", "Exports"]);
  assert.equal(
    text,
    "# CLAUDE.md\n\n## Project Overview\nA component library.\n\n## Exports\n- `@vaneui/ui`\n\n### Subpaths\n- `@vaneui/ui/css`\n",
  );
  assert.deepEqual(dropped, ["Release Policy", "A Section Added Later"]);
  assert.deepEqual(missing, []);
});

test("a section that is not on the allow-list does not ship", () => {
  const { text, dropped } = keepSections(source, CONSUMER_CLAUDE_SECTIONS);
  assert.doesNotMatch(text, /A Section Added Later|Not classified yet|Release Policy|main:prod/);
  assert.ok(dropped.includes("A Section Added Later"));
});

test("an allow-listed section the source no longer has is reported", () => {
  const { missing } = keepSections(source, ["Project Overview", "Component Inventory"]);
  assert.deepEqual(missing, ["Component Inventory"]);
});

test("only allow-listed rule files are kept", () => {
  const rules = ["component-usage.md", "testing.md", "prop-to-tailwind-mapping.md", "a-rule-added-later.md"].map(
    (file) => `/checkout/.claude/rules/${file}`,
  );
  const { kept, skipped, missing } = selectFiles(rules, CONSUMER_RULE_FILES);
  assert.deepEqual(kept, ["/checkout/.claude/rules/component-usage.md", "/checkout/.claude/rules/prop-to-tailwind-mapping.md"]);
  assert.deepEqual(skipped, ["/checkout/.claude/rules/testing.md", "/checkout/.claude/rules/a-rule-added-later.md"]);
  assert.deepEqual(missing, []);
  assert.deepEqual(selectFiles(rules.slice(1), CONSUMER_RULE_FILES).missing, ["component-usage.md"]);
});

test("the committed project overview holds exactly the allow-listed sections", () => {
  assert.deepEqual(headings(read("claude.md"), 2), [...CONSUMER_CLAUDE_SECTIONS]);
});

test("the committed corpus holds no agent file of the vaneui repo that is not on the allow-list", () => {
  // The docs site's pages have no level 1 heading (their title comes from the site's
  // metadata); the vaneui repo's CLAUDE.md and rule files open with one.
  const titled = pages.filter((file) => headings(read(file), 1).length > 0).sort();
  assert.deepEqual(titled, ["claude.md", ...CONSUMER_RULE_FILES].sort());
});

test("the committed corpus carries no contributor instructions", () => {
  for (const file of pages) {
    const text = read(file);
    for (const marker of [/npm run test:e2e/, /git push origin main/, /MUST run the full verification/, /MUST\*\* delegate/]) {
      assert.doesNotMatch(text, marker, `${file} holds contributor material`);
    }
  }
});
