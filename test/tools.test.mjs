// Runs against the compiled dist/ (npm test builds first).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COMMON_SLUG, formatComponentProps, getComponentProps } from "../dist/tools.js";

const index = JSON.parse(readFileSync(new URL("../resources/component-props.json", import.meta.url), "utf8"));
const slugs = Object.keys(index);

test("compact output lists own props by category with the default marked", async () => {
  const text = await formatComponentProps({ slug: "card" });
  assert.match(text, /^Size: xs sm md\* lg xl$/m);
  assert.match(text, /^Variant: filled outline\* ghost$/m);
  assert.match(text, /^Shared layout props \(get_component_props "common" lists them\): .*\bJustify\b/m);
  assert.match(text, /^Shared defaults: .*\bcolumn\b/m);
  assert.doesNotMatch(text, /justifyBetween/);
});

test("compact output names every shared category and lists no shared prop, for every component", async () => {
  for (const slug of slugs) {
    const text = await formatComponentProps({ slug });
    const shared = index[slug].filter((row) => row.isCommon);
    const categoryLines = text.split("\n").filter((line) => /^[A-Z][\w ]*: /.test(line) && !line.startsWith("Shared "));
    for (const row of shared) {
      assert.ok(!categoryLines.some((line) => line.split(": ")[1].split(" ").includes(row.prop) || line.split(": ")[1].split(" ").includes(`${row.prop}*`)), `${slug}: shared prop ${row.prop} listed`);
    }
    for (const category of new Set(shared.map((row) => row.category))) {
      assert.ok(text.includes(category), `${slug}: shared category ${category} not named`);
    }
    for (const row of index[slug].filter((r) => !r.isCommon)) {
      assert.ok(text.includes(row.isDefault ? `${row.prop}*` : row.prop), `${slug}: own prop ${row.prop} missing`);
    }
  }
});

test("full output has descriptions and the shared props", async () => {
  const text = await formatComponentProps({ slug: "card", detail: "full" });
  assert.match(text, /^ {2}md\*: /m);
  assert.match(text, /^ {2}justifyBetween: \S/m);
  assert.doesNotMatch(text, /Descriptions: call again/);
});

test("the common slug lists each shared prop once, with no defaults", async () => {
  const text = await formatComponentProps({ slug: COMMON_SLUG });
  assert.match(text, /^Justify: .*\bjustifyBetween\b/m);
  assert.equal(text.match(/\bjustifyBetween\b/g).length, 1);
  assert.doesNotMatch(text, /\*/);
  const rows = await getComponentProps({ slug: COMMON_SLUG });
  assert.ok(rows.every((row) => row.isCommon));
});

test("getComponentProps still returns the raw rows", async () => {
  assert.deepEqual(await getComponentProps({ slug: "button" }), index.button);
});

test("an unknown slug names the known ones, common included", async () => {
  await assert.rejects(formatComponentProps({ slug: "nope" }), /Known slugs: common, alert, /);
});
