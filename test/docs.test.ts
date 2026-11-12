// Runs against the compiled dist/ and the committed corpus in resources/.
import { test } from "node:test";
import assert from "node:assert/strict";
import type * as Docs from "../src/docs.js";

const docs: typeof Docs = await import(new URL("../dist/docs.js", import.meta.url).href);
const { INTRO_SECTION, loadCorpus, parseDoc, slugifyHeading } = docs;

const page = [
  "---",
  "componentKey: demo",
  `importPath: 'import { Demo } from "@vaneui/ui"'`,
  "paths:",
  '  - "**/*.tsx"',
  "---",
  "",
  "Intro paragraph.",
  "",
  "## Sizes",
  "Five sizes.",
  "",
  "```md",
  "## Not a heading",
  "```",
  "",
  "### With `code` and a [link](/docs/x)",
  "Nested text.",
  "",
  "## Sizes",
  "Second section of the same name.",
  "",
  "## 2. Numbered",
  "Last.",
].join("\n");

test("a page splits into an intro and its headings, outside code fences", () => {
  const doc = parseDoc("demo", "Demo", page);
  assert.equal(doc.title, "Demo");
  assert.deepEqual(doc.frontmatter, { componentKey: "demo", importPath: 'import { Demo } from "@vaneui/ui"' });
  assert.deepEqual(
    doc.sections.map((section) => [section.id, section.heading, section.level]),
    [
      [INTRO_SECTION, "Demo", 0],
      ["sizes", "Sizes", 2],
      ["with-code-and-a-link", "With code and a link", 3],
      ["sizes-2", "Sizes", 2],
      ["id-2-numbered", "2. Numbered", 2],
    ],
  );
});

test("a section knows its own text, its subsections and its parents", () => {
  const doc = parseDoc("demo", "Demo", page);
  const text = (from: number, to: number): string => doc.lines.slice(from, to).join("\n").trim();
  const [intro, sizes, nested] = doc.sections;
  assert.equal(text(intro.start, intro.end), "Intro paragraph.");
  assert.equal(text(sizes.start, sizes.bodyEnd), "## Sizes\nFive sizes.\n\n```md\n## Not a heading\n```");
  assert.match(text(sizes.start, sizes.end), /Nested text\.$/);
  assert.deepEqual(nested.parents, ["Sizes"]);
  assert.equal(doc.lines[nested.start], "### With `code` and a [link](/docs/x)");
});

test("a level 1 heading that opens the page is its title, and its text the intro", () => {
  const doc = parseDoc("guide", "Guide", "---\npaths:\n---\n\n# The Guide\n\nAbout it.\n\n## Setup\nSteps.\n");
  assert.equal(doc.title, "The Guide");
  assert.deepEqual(doc.sections.map((section) => section.id), [INTRO_SECTION, "setup"]);
  assert.deepEqual(doc.sections[1].parents, []);
  const intro = doc.sections[0];
  assert.equal(doc.lines.slice(intro.start, intro.end).join("\n").trim(), "About it.");
});

test("section ids match the heading anchors of the docs site", () => {
  assert.equal(slugifyHeading("Strong border for a selected card"), "strong-border-for-a-selected-card");
  assert.equal(slugifyHeading("Keeping its size in a row with noShrink"), "keeping-its-size-in-a-row-with-noshrink");
  assert.equal(slugifyHeading("How the light-dark() color pairs resolve"), "how-the-light-dark-color-pairs-resolve");
  assert.equal(slugifyHeading("Café & crème"), "cafe-creme");
  assert.equal(slugifyHeading("12 placements"), "id-12-placements");
});

test("every page of the corpus parses, with unique section ids", async () => {
  const corpus = await loadCorpus();
  assert.ok(corpus.length > 40);
  for (const doc of corpus) {
    const ids = doc.sections.map((section) => section.id);
    assert.equal(ids[0], INTRO_SECTION);
    assert.equal(new Set(ids).size, ids.length, `${doc.slug}: duplicate section id`);
    assert.ok(doc.title.length > 0);
  }
});
