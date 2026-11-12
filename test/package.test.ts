// The Node range the package declares, checked against what its runtime dependencies
// declare in package-lock.json. The server is plain compiled JavaScript, so the range
// is the lowest Node the dependencies accept: a narrower one makes `npx @vaneui/mcp`
// warn or fail on a Node that runs the server, a wider one promises a Node they refuse.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

interface LockedPackage {
  dev?: boolean;
  engines?: { node?: string };
}

const readJson = <T>(name: string): T => JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), "utf8"));

const manifest = readJson<{ engines?: { node?: string } }>("package.json");
const lock = readJson<{ packages: Record<string, LockedPackage> }>("package-lock.json");

/** The lowest Node major a range such as `>= 18`, `>=16.9.0` or `^18 || >=20` accepts. */
function lowestMajor(range: string): number {
  const majors = range.split("||").map((part) => Number(/\d+/.exec(part)?.[0] ?? 0));
  return Math.min(...majors);
}

test("the declared Node range is the lowest one the runtime dependencies accept", () => {
  const declared = /^>=(\d+)$/.exec(manifest.engines?.node ?? "");
  assert.ok(declared, `engines.node should be an open range like ">=20", not "${manifest.engines?.node}"`);

  let needed = 0;
  let neededBy = "";
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path === "" || entry.dev || !entry.engines?.node) continue;
    const major = lowestMajor(entry.engines.node);
    if (major > needed) [needed, neededBy] = [major, path.replace(/^.*node_modules\//, "")];
  }
  assert.ok(needed > 0, "package-lock.json lists no runtime dependency with a Node range");
  assert.equal(Number(declared[1]), needed, `${neededBy} needs Node ${needed} or later`);
});

test("package-lock.json carries the same Node range as package.json", () => {
  assert.equal(lock.packages[""].engines?.node, manifest.engines?.node);
});
