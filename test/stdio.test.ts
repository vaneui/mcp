// Starts the built server the way a client does (`node dist/server.js` over stdio) and
// calls its tools, so it covers the code and the corpus that ship.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface Hit {
  slug: string;
  section: string;
  heading: string;
  lineNumber: number;
  snippet: string;
}

const client = new Client({ name: "stdio-test", version: "0.0.0" });

before(async () => {
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("../dist/server.js", import.meta.url))],
    }),
  );
});

after(async () => {
  await client.close();
});

/** Text blocks of a tool result. */
async function call(name: string, args: Record<string, unknown>): Promise<{ texts: string[]; isError: boolean }> {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as { type: string; text?: string }[];
  return { texts: content.map((block) => block.text ?? ""), isError: result.isError === true };
}

async function search(args: Record<string, unknown>): Promise<Hit[]> {
  const { texts, isError } = await call("search_docs", args);
  assert.equal(isError, false, texts.join("\n"));
  return texts[0].startsWith("[") ? (JSON.parse(texts[0]) as Hit[]) : [];
}

test("search_docs finds the theme-defaults guide for themeDefaults", async () => {
  const hits = await search({ query: "themeDefaults" });
  assert.equal(hits[0]?.slug, "theme-defaults");
});

test("search_docs answers a query of several words", async () => {
  const hits = await search({ query: "modal focus trap" });
  assert.equal(hits[0]?.slug, "modal");
  for (const hit of hits) assert.ok(hit.section && hit.heading && hit.snippet, JSON.stringify(hit));
});

test("search_docs says when it returned only the best of the matches", async () => {
  const cut = await call("search_docs", { query: "button", limit: 4 });
  assert.equal((JSON.parse(cut.texts[0]) as Hit[]).length, 4);
  assert.match(cut.texts[1], /^Showing the best 4 of \d+ matching sections/);

  const whole = await call("search_docs", { query: "flex-1" });
  assert.equal(whole.texts.length, 1);
  assert.equal((JSON.parse(whole.texts[0]) as Hit[]).length, 1);
});

test("search_docs reports no match and a bad regex in words", async () => {
  const none = await call("search_docs", { query: "zzzqqq" });
  assert.equal(none.isError, false);
  assert.match(none.texts[0], /^No matches for "zzzqqq" across \d+ VaneUI docs\.$/);

  const bad = await call("search_docs", { query: "(", regex: true });
  assert.equal(bad.isError, true);
  assert.match(bad.texts[0], /^search_docs failed: Invalid regex/);
});

test("get_component_props answers over stdio", async () => {
  const { texts, isError } = await call("get_component_props", { slug: "button" });
  assert.equal(isError, false);
  assert.match(texts[0], /^button boolean props\./);
});

test("get_doc returns a page outline, then the section a search result names", async () => {
  const page = await call("get_doc", { slug: "modal" });
  assert.equal(page.isError, false, page.texts[0]);
  assert.match(page.texts[0], /^# Modal\n/);
  assert.match(page.texts[0], /^- basic-usage: Basic usage$/m);

  const [hit] = await search({ query: "modal focus trap" });
  const section = await call("get_doc", { slug: hit.slug, section: hit.section });
  assert.equal(section.isError, false, section.texts[0]);
  assert.ok(section.texts[0].includes(`## ${hit.heading}`));
});
