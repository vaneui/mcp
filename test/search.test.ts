// Runs against the compiled dist/ and the committed corpus in resources/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type * as Docs from "../src/docs.js";
import type * as Search from "../src/search.js";

const search: typeof Search = await import(new URL("../dist/search.js", import.meta.url).href);
const docs: typeof Docs = await import(new URL("../dist/docs.js", import.meta.url).href);
const { DEFAULT_LIMIT, MAX_PER_PAGE, MAX_RESULTS, queryTerms, searchDocs } = search;

const corpus = await docs.loadCorpus();

/** Lowercased text a section can be found by: its page, the headings above it, its heading and its own text. */
function sectionText(slug: string, id: string): string {
  const doc = corpus.find((entry) => entry.slug === slug);
  const section = doc?.sections.find((entry) => entry.id === id);
  assert.ok(doc && section, `${slug}#${id} is not a section of the corpus`);
  const own = doc.lines.slice(section.start, section.bodyEnd).join(" ");
  return [slug, doc.title, ...section.parents, section.heading, own].join(" ").toLowerCase();
}

test("a prop name reaches the guide about it, and the pages after it in the alphabet", async () => {
  const { hits, total } = await searchDocs({ query: "themeDefaults" });
  assert.equal(hits[0].slug, "theme-defaults");
  assert.equal(hits[0].section, "intro");
  assert.ok(hits.some((hit) => hit.slug === "using-theme-provider"));
  assert.ok(total > hits.length);
});

test("a query of several words matches sections that hold the words apart", async () => {
  const { hits } = await searchDocs({ query: "modal focus trap" });
  assert.ok(hits.length > 0);
  assert.equal(hits[0].slug, "modal");
  for (const word of ["modal", "focus", "trap"]) {
    assert.ok(sectionText(hits[0].slug, hits[0].section).includes(word), `first hit lacks "${word}"`);
  }
});

test("stop words and word endings do not hide a match", async () => {
  assert.deepEqual(queryTerms("How do I center the buttons?"), ["center", "button"]);
  assert.deepEqual(queryTerms("focus trapping in VaneUI"), ["focus", "trap"]);
  assert.deepEqual(queryTerms("extra classes"), ["extra", "class"]);
  const { hits } = await searchDocs({ query: "how to center a row" });
  assert.equal(hits[0].slug, "row");
});

test("names and code are searched as written", async () => {
  assert.deepEqual(queryTerms("`themeDefaults` --fs-unit @vaneui/ui/tokens useTheme()"), [
    "themedefaults",
    "--fs-unit",
    "@vaneui/ui/tokens",
    "usetheme",
  ]);
  const { hits, total } = await searchDocs({ query: "flex-1" });
  assert.equal(total, 1);
  assert.equal(hits[0].slug, "prop-to-tailwind-mapping");
  assert.match(hits[0].snippet, /`flex1` \| `flex-1`/);
});

test("a single word that names a page puts the page first", async () => {
  const { hits } = await searchDocs({ query: "button" });
  assert.deepEqual([hits[0].slug, hits[0].section], ["button", "intro"]);
  const { hits: spaced } = await searchDocs({ query: "icon button" });
  assert.deepEqual([spaced[0].slug, spaced[0].section], ["icon-button", "intro"]);
});

test("a word in a heading ranks above the same word in the text", async () => {
  const { hits } = await searchDocs({ query: "mergeStrategy", limit: MAX_RESULTS });
  const inHeading = hits.map((hit) => hit.heading.toLowerCase().includes("mergestrategy"));
  assert.equal(inHeading[0], true);
  assert.ok(inHeading.includes(false), "expected hits that only mention it in the text");
  assert.ok(inHeading.lastIndexOf(true) < inHeading.indexOf(false));
});

test("a phrase is found as a phrase", async () => {
  const { hits } = await searchDocs({ query: "dark mode" });
  assert.deepEqual([hits[0].slug, hits[0].section], ["dark-mode", "intro"]);
  const { hits: headed } = await searchDocs({ query: "responsive breakpoints" });
  assert.match(headed[0].heading, /^Responsive breakpoints$/i);
  const { hits: quoted } = await searchDocs({ query: '"focus trap"' });
  assert.match(quoted[0].snippet, /focus trap/i);
});

test("sections with every word come before sections with some", async () => {
  const query = "focus trap";
  const { hits } = await searchDocs({ query, limit: MAX_RESULTS });
  const complete = hits.map((hit) => queryTerms(query).every((term) => sectionText(hit.slug, hit.section).includes(term)));
  assert.equal(complete[0], true);
  assert.ok(complete.includes(false), "expected partial matches at the end of the list");
  assert.ok(complete.lastIndexOf(true) < complete.indexOf(false));
});

test("a word found nowhere does not empty the result", async () => {
  const { hits } = await searchDocs({ query: "modal zzzqqq" });
  assert.equal(hits[0].slug, "modal");
});

test("no match gives an empty result", async () => {
  assert.deepEqual(await searchDocs({ query: "zzzqqq" }), { hits: [], total: 0 });
});

test("the order is stable: the same query gives the same list, and a smaller limit its start", async () => {
  const first = await searchDocs({ query: "default size" });
  assert.deepEqual(await searchDocs({ query: "default size" }), first);
  const three = await searchDocs({ query: "default size", limit: 3 });
  assert.deepEqual(three.hits, first.hits.slice(0, 3));
  assert.equal(three.total, first.total);
});

test("the limit caps the list, and one page cannot fill it", async () => {
  const byDefault = await searchDocs({ query: "button" });
  assert.equal(byDefault.hits.length, DEFAULT_LIMIT);
  assert.ok(byDefault.total > DEFAULT_LIMIT);

  const most = await searchDocs({ query: "button", limit: 1000 });
  assert.equal(most.hits.length, MAX_RESULTS);
  const perPage = new Map<string, number>();
  for (const hit of most.hits) perPage.set(hit.slug, (perPage.get(hit.slug) ?? 0) + 1);
  assert.equal(Math.max(...perPage.values()), MAX_PER_PAGE);
  assert.ok(perPage.size > MAX_RESULTS / MAX_PER_PAGE - 1);
});

test("each hit names a section of the corpus and quotes the line it points at", async () => {
  for (const query of ["themeDefaults", "modal focus trap", "Sizes", "card"]) {
    const { hits } = await searchDocs({ query });
    for (const hit of hits) {
      assert.equal(hit.uri, `vaneui://docs/${hit.slug}`);
      sectionText(hit.slug, hit.section);
      const lines = readFileSync(new URL(`../resources/${hit.slug}.md`, import.meta.url), "utf8").split("\n");
      const line = lines[hit.lineNumber - 1].replace(/\s+/g, " ");
      const quoted = hit.snippet.replace(/^\.\.\.|\.\.\.$/g, "");
      assert.ok(quoted.length > 0 && line.includes(quoted), `${hit.slug}:${hit.lineNumber} does not hold "${quoted}"`);
    }
  }
});

test("regex mode matches line by line, headings as written", async () => {
  const { hits } = await searchDocs({ query: "theme(Defaults|Override)\\b", regex: true });
  assert.ok(hits.length > 0);
  for (const hit of hits) assert.match(sectionText(hit.slug, hit.section), /theme(defaults|override)/);

  const headings = await searchDocs({ query: "^## Sizes$", regex: true, limit: MAX_RESULTS });
  assert.ok(headings.hits.length > 10);
  for (const hit of headings.hits) assert.equal(hit.heading, "Sizes");
});

test("a bad regex and an empty query are errors", async () => {
  await assert.rejects(searchDocs({ query: "(", regex: true }), /Invalid regex/);
  await assert.rejects(searchDocs({ query: "   " }), /non-empty/);
});
