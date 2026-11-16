// The props sync reads a component's key from the frontmatter of its docs page. These tests
// cover how a page found in a component directory is classified
// (scripts/component-pages.ts, run as TypeScript): a guide that sits beside the component
// pages must not stop a strict sync, and a component page that lost its key still must.
import { test } from "node:test";
import assert from "node:assert/strict";
import type * as ComponentPages from "../scripts/component-pages.js";

const { classifyComponentDirPage, parseFrontmatter }: typeof ComponentPages = await import(
  new URL("../scripts/component-pages.ts", import.meta.url).href
);

test("a page whose frontmatter names a componentKey is a component page", () => {
  const page = ["---", "componentKey: button", 'importPath: \'import { Button } from "@vaneui/ui"\'', "---", "", "Text."].join("\n");
  assert.deepEqual(classifyComponentDirPage(page), { kind: "component", componentKey: "button" });
});

test("a quoted componentKey loses its quotes", () => {
  assert.deepEqual(classifyComponentDirPage('---\ncomponentKey: "navLink"\n---\n'), { kind: "component", componentKey: "navLink" });
  assert.deepEqual(parseFrontmatter("---\nsince: '1.5.0'\n---\n"), { since: "1.5.0" });
});

test("a page without frontmatter is a guide", () => {
  const guide = ["A form is a native `<form>` element with controls inside it.", "", "## A form with Field", "", "Text."].join("\n");
  assert.deepEqual(classifyComponentDirPage(guide), { kind: "guide" });
  assert.deepEqual(classifyComponentDirPage(""), { kind: "guide" });
});

test("a horizontal rule further down a guide is not frontmatter", () => {
  assert.deepEqual(classifyComponentDirPage("Intro.\n\n---\n\ncomponentKey: button\n\n---\n"), { kind: "guide" });
});

test("a page with frontmatter but no componentKey is reported", () => {
  const page = ["---", 'importPath: \'import { Button } from "@vaneui/ui"\'', "since: 1.0.0", "---", "", "Text."].join("\n");
  assert.deepEqual(classifyComponentDirPage(page), { kind: "missing-key" });
  assert.deepEqual(classifyComponentDirPage("---\ncomponentKey:\nsince: 1.0.0\n---\n"), { kind: "missing-key" });
});
