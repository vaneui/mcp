// Drives the compiled server through a real MCP client over an in-memory transport:
// tool listing, input validation and the tool results a model sees.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type * as CreateServer from "../src/createServer.js";

const { createServer }: typeof CreateServer = await import(new URL("../dist/createServer.js", import.meta.url).href);

const resourcesDir = new URL("../resources/", import.meta.url);
const pages = readdirSync(resourcesDir)
  .filter((file) => file.endsWith(".md"))
  .sort()
  .map((file) => file.replace(/\.md$/, ""));

const client = new Client({ name: "server-test", version: "0.0.0" });
const server = createServer();

before(async () => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
});

after(async () => {
  await client.close();
  await server.close();
});

interface Called {
  text: string;
  texts: string[];
  isError: boolean;
}

async function call(name: string, args: Record<string, unknown>): Promise<Called> {
  const result = await client.callTool({ name, arguments: args });
  const texts = (result.content as { type: string; text?: string }[]).map((block) => block.text ?? "");
  return { text: texts.join("\n"), texts, isError: result.isError === true };
}

async function getDoc(args: Record<string, unknown>): Promise<string> {
  const { text, isError } = await call("get_doc", args);
  assert.equal(isError, false, text);
  return text;
}

test("the server lists its three tools, and get_doc says to search first", async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((tool) => tool.name).sort(), ["get_component_props", "get_doc", "search_docs"]);

  const getDocTool = tools.find((tool) => tool.name === "get_doc");
  assert.match(getDocTool?.description ?? "", /Call search_docs first/);
  assert.deepEqual(getDocTool?.inputSchema.required, ["slug"]);
  assert.deepEqual(Object.keys(getDocTool?.inputSchema.properties ?? {}), ["slug", "section"]);

  const searchTool = tools.find((tool) => tool.name === "search_docs");
  assert.match(searchTool?.description ?? "", /get_doc/);
  assert.deepEqual(searchTool?.inputSchema.required, ["query"]);
  assert.deepEqual(Object.keys(searchTool?.inputSchema.properties ?? {}), ["query", "regex", "limit"]);

  const propsTool = tools.find((tool) => tool.name === "get_component_props");
  assert.match(propsTool?.description ?? "", /get_doc/);
});

test("get_doc with only a slug returns the intro and the section list, not the sections", async () => {
  const text = await getDoc({ slug: "modal" });
  assert.match(text, /^# Modal\nvaneui:\/\/docs\/modal \(slug "modal"\)\nImport: import \{ Modal \} from "@vaneui\/ui"\n/);
  assert.match(text, /\n\nUse Modal when the user has to finish or dismiss a task/);
  assert.match(text, /^Sections \(call get_doc again with one of these ids as `section`\):$/m);
  assert.match(text, /^- basic-usage: Basic usage$/m);
  assert.match(text, /^- accessibility-and-advanced-props: Accessibility and advanced props$/m);
  assert.doesNotMatch(text, /```/);
  assert.doesNotMatch(text, /^---$/m);
  const whole = readFileSync(new URL("modal.md", resourcesDir), "utf8");
  assert.ok(text.length < whole.length / 4, "the outline should be a fraction of the page");
});

test("the section list shows nested headings under their parent", async () => {
  const text = await getDoc({ slug: "theme-defaults" });
  assert.match(text, /^- setting-component-defaults: Setting component defaults\n {2}- basic-defaults: Basic defaults$/m);
});

test("get_doc with a section returns that section in full, value props and code included", async () => {
  const text = await getDoc({ slug: "modal", section: "accessibility-and-advanced-props" });
  assert.match(text, /^Modal > Accessibility and advanced props \(slug "modal", section "accessibility-and-advanced-props"\)\n\n## Accessibility and advanced props\n/);
  assert.match(text, /`focusTrap`/);
  assert.doesNotMatch(text, /^## Customizing$/m);

  const usage = await getDoc({ slug: "modal", section: "basic-usage" });
  assert.match(usage, /```tsx demo\n[\s\S]*<Modal open=\{open\} onClose=\{\(\) => setOpen\(false\)\}>[\s\S]*```/);
  assert.doesNotMatch(usage, /^## Compound Modal$/m);
});

test("a section comes with its subsections, and a subsection names its parents", async () => {
  const parent = await getDoc({ slug: "theme-defaults", section: "setting-component-defaults" });
  assert.match(parent, /^### Basic defaults$/m);
  assert.match(parent, /^### Consistent appearance defaults$/m);
  assert.doesNotMatch(parent, /^## Available boolean props$/m);

  const child = await getDoc({ slug: "theme-defaults", section: "basic-defaults" });
  assert.match(child, /^Theme Defaults > Setting component defaults > Basic defaults \(/);
  assert.doesNotMatch(child, /^### Consistent appearance defaults$/m);
});

test("the slug may be written in the ways a model meets it", async () => {
  const expected = await getDoc({ slug: "icon-button" });
  for (const slug of [
    "Icon-Button",
    "icon-button.md",
    "IconButton",
    "iconButton",
    "icon_button",
    "icon button",
    "basic-components/icon-button",
    "/docs/basic-components/icon-button",
    "https://vaneui.com/docs/basic-components/icon-button",
    "vaneui://docs/icon-button",
    "resources/icon-button.md",
  ]) {
    assert.equal(await getDoc({ slug }), expected, slug);
  }
  assert.match(await getDoc({ slug: "NavLink" }), /^# Navlink\n/);
});

test("a docs link with a fragment opens that section", async () => {
  const linked = await getDoc({ slug: "/docs/layout-components/card#strong-border-for-a-selected-card" });
  assert.equal(linked, await getDoc({ slug: "card", section: "strong-border-for-a-selected-card" }));
  // An explicit section wins over the fragment.
  assert.equal(await getDoc({ slug: "card#sizes", section: "appearances" }), await getDoc({ slug: "card", section: "appearances" }));
});

test("the section may be given as its heading, and `intro` is the outline", async () => {
  const byId = await getDoc({ slug: "button", section: "basic-usage" });
  assert.equal(await getDoc({ slug: "button", section: "Basic usage" }), byId);
  assert.equal(await getDoc({ slug: "button", section: "## Basic usage" }), byId);
  assert.equal(await getDoc({ slug: "button", section: "intro" }), await getDoc({ slug: "button" }));
  assert.equal(await getDoc({ slug: "button", section: "  " }), await getDoc({ slug: "button" }));
});

test("an unknown slug is an error that suggests the closest pages and lists them all", async () => {
  const sub = await call("get_doc", { slug: "ModalHeader" });
  assert.equal(sub.isError, true);
  assert.equal(
    sub.text,
    `get_doc failed: No VaneUI doc "ModalHeader". Did you mean: modal? Pages: ${pages.join(", ")}. search_docs finds the page for a topic.`,
  );

  assert.match((await call("get_doc", { slug: "buton" })).text, /Did you mean: button\?/);
  assert.match((await call("get_doc", { slug: "grid3" })).text, /Did you mean: grid\?/);
  assert.match((await call("get_doc", { slug: "themeProvider" })).text, /Did you mean: using-theme-provider\?/);
  const far = await call("get_doc", { slug: "zzzqqq" });
  assert.equal(far.isError, true);
  assert.doesNotMatch(far.text, /Did you mean/);
});

test("an unknown section is an error that lists the page's sections", async () => {
  const miss = await call("get_doc", { slug: "modal", section: "size" });
  assert.equal(miss.isError, true);
  assert.match(miss.text, /^get_doc failed: No section "size" in "modal"\. Did you mean: sizes\? Sections: intro, basic-usage, /);
});

test("get_component_props takes the same slug spellings and suggests on a miss", async () => {
  const props = await call("get_component_props", { slug: "IconButton" });
  assert.equal(props.isError, false, props.text);
  assert.match(props.text, /^icon-button boolean props\./);

  const miss = await call("get_component_props", { slug: "ModalHeader" });
  assert.equal(miss.isError, true);
  assert.match(miss.text, /^get_component_props failed: Unknown component slug "ModalHeader"\. Did you mean: modal\? Known slugs: common, alert, /);
});

test("the server rejects a call without a slug or with a limit out of range", async () => {
  const missing = await call("get_doc", {});
  assert.equal(missing.isError, true);
  assert.match(missing.text, /Invalid arguments for tool get_doc/);
  const tooMany = await call("search_docs", { query: "button", limit: 0 });
  assert.equal(tooMany.isError, true);
  assert.match(tooMany.text, /Invalid arguments for tool search_docs/);
});

test("every search result can be passed to get_doc", async () => {
  for (const query of ["themeDefaults", "modal focus trap", "how to center a row", "dark mode", "button"]) {
    const found = await call("search_docs", { query });
    const hits = JSON.parse(found.texts[0]) as { slug: string; section: string; heading: string }[];
    assert.ok(hits.length > 0, query);
    for (const hit of hits) {
      const text = await getDoc({ slug: hit.slug, section: hit.section });
      assert.ok(text.includes(hit.heading), `${hit.slug}#${hit.section} lacks its heading`);
    }
  }
});

test("every page has an outline, and every listed section can be read", async () => {
  for (const slug of pages) {
    const outline = await getDoc({ slug });
    const ids = [...outline.matchAll(/^ *- ([a-z0-9-]+): /gm)].map((match) => match[1]);
    for (const section of ids) await getDoc({ slug, section });
  }
});

test("the docs stay readable as resources", async () => {
  const { resources } = await client.listResources();
  assert.deepEqual(resources.map((resource) => resource.uri).sort(), pages.map((slug) => `vaneui://docs/${slug}`).sort());
  const [content] = (await client.readResource({ uri: "vaneui://docs/button" })).contents;
  assert.ok("text" in content);
  assert.equal(content.text, readFileSync(new URL("button.md", resourcesDir), "utf8"));
});
