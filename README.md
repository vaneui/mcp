# @vaneui/mcp

[![npm version](https://img.shields.io/npm/v/@vaneui/mcp?color=cb3837&logo=npm)](https://www.npmjs.com/package/@vaneui/mcp)
[![license](https://img.shields.io/npm/l/@vaneui/mcp)](./LICENSE)
[![Model Context Protocol](https://img.shields.io/badge/MCP-server-blue)](https://modelcontextprotocol.io)

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the [VaneUI](https://vaneui.com) documentation to AI coding agents. Any MCP-aware client (Claude Code, Claude Desktop, Cursor, VS Code, etc.) can search the docs and read the section that answers the question, so your agent writes correct VaneUI code without you pasting rules into prompts by hand.

It serves the full component reference, getting-started and customization guides, and a structured prop table for every component, through three tools: `search_docs`, `get_doc` and `get_component_props`.

## Requirements

- **Node.js 20 or later** (the `npx` command below downloads and runs the server for you).

## Quickstart

The server runs over stdio and is published to npm as `@vaneui/mcp`. Add it to your client with the snippets below; no local clone or build is needed.

### Claude Code

```bash
claude mcp add vaneui -- npx -y @vaneui/mcp
```

### Claude Desktop

Edit your `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vaneui": {
      "command": "npx",
      "args": ["-y", "@vaneui/mcp"]
    }
  }
}
```

Restart Claude Desktop afterward.

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per project):

```json
{
  "mcpServers": {
    "vaneui": {
      "command": "npx",
      "args": ["-y", "@vaneui/mcp"]
    }
  }
}
```

### VS Code

```bash
code --add-mcp '{"name":"vaneui","command":"npx","args":["-y","@vaneui/mcp"]}'
```

Or add to `.vscode/mcp.json` (note VS Code uses the `servers` key):

```json
{
  "servers": {
    "vaneui": {
      "command": "npx",
      "args": ["-y", "@vaneui/mcp"]
    }
  }
}
```

### Other clients

Any client that accepts a stdio MCP server works. Use `npx` as the command and `-y @vaneui/mcp` as the args, following that client's config format.

## How to use it

Once the server is connected, just build with VaneUI in natural language. The agent pulls the right docs through the tools automatically:

- *"Using VaneUI, build a pricing card with a title, a feature list, and a filled primary button."* → the agent reads `card`, `list`, and `button` props and composes them correctly.
- *"What's the default appearance and variant of `Chip`?"* → `get_component_props` returns the prop table (Chip defaults to `secondary` + `outline`, not `primary`).
- *"How do I set app-wide defaults for every Button?"* → `search_docs` finds the `themeDefaults` sections of the theming guides, and `get_doc` reads the one that shows the `ThemeProvider themeDefaults` pattern.
- *"Does `Modal` trap focus, and can I turn that off?"* → `search_docs` points at the "Accessibility and advanced props" section of the Modal page, and `get_doc` returns it with the `focusTrap` prop and its default.
- *"Which VaneUI prop maps to `flex-1`?"* → `search_docs` finds it in the prop-to-Tailwind mapping.

## Verifying it works

After adding the server and restarting your client:

- The client should list a server named **`vaneui`** with the tools `search_docs`, `get_doc` and `get_component_props` (and the `vaneui://docs/*` resources).
- To smoke-test the server directly, run `npx -y @vaneui/mcp` in a terminal. It starts and waits on stdio (no output is normal for an MCP stdio server; press Ctrl+C to exit).

## Tools

A typical lookup takes two calls: `search_docs` to find the section, then `get_doc` to read it. `get_component_props` answers "which boolean props does this component take" in one call.

### `search_docs`

Ranked search across the full doc corpus. The results are doc sections, best first.

| Param | Type | Notes |
|-------|------|-------|
| `query` | string | Required. A few words (`modal focus trap`) or an exact name (`themeDefaults`). Case-insensitive. |
| `regex` | boolean | Optional. If `true`, `query` is parsed as a JavaScript regex and matched line by line. Defaults to `false`. |
| `limit` | integer | Optional. Most sections to return, 1 to 50. Defaults to 10. |

The query is split into words, and common words such as "how" and "the" are ignored. A section that holds every word comes before a section that holds some of them. Within each group a word counts most in the section's heading, then in the page title, then in the text, and rare words count more than common ones. The words do not have to appear together or in order, and a plain word also finds its other forms (`trap` finds "trapping").

The first content block is a JSON array of sections:

```json
[
  {
    "uri": "vaneui://docs/modal",
    "slug": "modal",
    "section": "accessibility-and-advanced-props",
    "heading": "Accessibility and advanced props",
    "lineNumber": 368,
    "snippet": "| `focusTrap` | `true` | Trap `Tab` / `Shift+Tab` focus inside the modal |"
  }
]
```

`slug` and `section` are what `get_doc` takes. `lineNumber` and `snippet` show the best matching line of the section (the line's number in the page). A list holds at most 3 sections of one page, so one long page cannot fill it. When more sections matched than were returned, a second content block says so (`Showing the best 3 of 88 matching sections ...`). Use this before guessing prop names, defaults, or class mappings: the answer is almost always already in the docs.

### `get_doc`

Reads a docs page, or one section of it. The other two tools return snippets and boolean props, so this is the tool that returns the text of the docs: value props such as Modal's `open` and `onClose`, sub-components and code examples.

| Param | Type | Notes |
|-------|------|-------|
| `slug` | string | Required. The page slug, e.g. `modal` or `theme-defaults`. |
| `section` | string | Optional. A section id from the page's section list or from a `search_docs` result. The heading text works too. |

With only `slug` it returns the page's intro and the list of its sections, not the whole page:

```text
# Modal
vaneui://docs/modal (slug "modal")
Import: import { Modal } from "@vaneui/ui"
Since: 0.9.0

Use Modal when the user has to finish or dismiss a task before returning to the page, ...

Sections (call get_doc again with one of these ids as `section`):
- basic-usage: Basic usage
- compound-modal: Compound Modal
...
- accessibility-and-advanced-props: Accessibility and advanced props
```

With `section` it returns that section in full, with its subsections and code examples. Section ids are the heading anchors of the page on vaneui.com.

The slug is matched loosely, so the forms a model meets all work: a component name (`IconButton`), a file name (`icon-button.md`), a docs link (`/docs/basic-components/icon-button`) or a resource URI (`vaneui://docs/icon-button`). A docs link with a `#fragment` opens that section. An unknown page or section is a tool error that names the closest matches and lists what exists:

```text
get_doc failed: No VaneUI doc "ModalHeader". Did you mean: modal? Pages: ai-assistants, alert, badge, ...
```

### `get_component_props`

Returns a component's boolean props as plain text, one line per category, with the default marked `*`. Props in one category are alternatives. The data comes from `@vaneui/ui`'s `ComponentCategories`, `ComponentKeys`, `defaultTheme`, and `PropDescriptions`.

| Param | Type | Notes |
|-------|------|-------|
| `slug` | string | Required. The component slug, matching the resource basename, e.g. `button`, `card`, `icon-button`, `page-title`. `common` lists the shared layout props. Matched as loosely as in `get_doc`, so `IconButton` works, and an unknown slug names the closest components. |
| `detail` | `"compact"` \| `"full"` | Optional. Defaults to `"compact"`. |

The shared layout props (display, gap, justify, border, width and the rest) are the same on most components, so `compact` output leaves them out: it lists the component's own props, then names the shared categories the component takes and its shared defaults. Call it with `slug: "common"` once to get those props. `full` adds a description to every prop and lists the shared props too.

```text
card boolean props. Props in one category are alternatives; * marks the default. Descriptions: call again with detail "full".
Size: xs sm md* lg xl
Appearance: primary* accent secondary tertiary success danger warning info inheritAppearance
Variant: filled outline* ghost
...
Shared layout props (get_component_props "common" lists them): Hide, Show, Items, Justify, ...
Shared defaults: flex gap column border responsiveSizing
```

Props that take a value, such as Field's `label` or Modal's `title`, are not boolean category props: read them on the component's page with `get_doc` and the same slug.

## Available resources

Each documentation file is also exposed as a resource named `vaneui://docs/<slug>`, where `<slug>` is the lowercased source filename minus the `.md` extension. All resources have `mimeType: text/markdown`. A resource is the whole page. Clients without resource support read the same pages through `get_doc`.

Examples:

- `vaneui://docs/claude`: VaneUI overview (component inventory, the boolean prop system, key defaults, package exports).
- `vaneui://docs/component-usage`, `vaneui://docs/prop-to-tailwind-mapping`: the usage guide (component selection, patterns, anti-patterns) and the prop-to-Tailwind class mapping.
- `vaneui://docs/installation`, `vaneui://docs/usage-basics`, `vaneui://docs/core-concepts`, `vaneui://docs/nextjs`, `vaneui://docs/ai-assistants`: getting-started guides.
- `vaneui://docs/theming-overview`, `vaneui://docs/using-theme-provider`, `vaneui://docs/theme-defaults`, `vaneui://docs/theme-and-override`, `vaneui://docs/extra-classes`, `vaneui://docs/customizing-styles`, `vaneui://docs/variant-inheritance`, `vaneui://docs/css-variables`, `vaneui://docs/dark-mode`: customization guides.
- `vaneui://docs/common-props`: shared layout/typography prop reference.
- `vaneui://docs/button`, `vaneui://docs/card`, `vaneui://docs/modal`, ...: one per component.

The corpus holds what helps a project that uses VaneUI. The rule files the vaneui repo keeps for work on the library itself (component internals, CSS conventions, tests, playground) are not part of it.

---

## Development

This section is for contributors and maintainers working on the server itself.

### Sources

The doc corpus is bundled from two sibling repos at build time:

- **`vaneui/`** (a checkout of [vaneui/vaneui](https://github.com/vaneui/vaneui)) — the consumer-facing parts of its agent files: an allow-list of `.claude/rules/*.md` files and of `CLAUDE.md` sections.
- **`vaneui-web/`** (a checkout of [vaneui/web](https://github.com/vaneui/web)) — narrative guides and per-component reference, authored as plain markdown under `app/docs/data/**/*.md` (one file per component, with frontmatter).

Each `.md` file goes into `resources/` keyed by its basename (filenames are globally unique, so the corpus is flat).

The vaneui repo's `CLAUDE.md` and `.claude/rules/` are written for people and agents who work on the library itself, and most of that (the verification pipeline, the release policy, test and playground conventions, theme internals) would steer an agent in a project that only uses VaneUI. So the sync ships an allow-list, kept in `scripts/consumer-docs.ts`: the rule files named in `CONSUMER_RULE_FILES` are copied verbatim, and `CLAUDE.md` keeps only the `## ` sections named in `CONSUMER_CLAUDE_SECTIONS`. A new rule file or section stays out of the corpus until it is added there; the sync log names what it left out, and the strict sync fails when an allow-listed file or section is gone (renamed upstream). `test/sync.test.ts` checks the filter and the committed corpus: it fails when `resources/claude.md` holds a section, or `resources/` a vaneui rule file, that is not on the list.

`vaneui-web/` pages are written with their `{% include "x.md" %}` tags expanded through vaneui-web's own include helper (`lib/docs/includes.mjs`), so each resource matches the page on vaneui.com. Files and directories whose name starts with `_` are partials that pages include, so they get no resource of their own. `scripts/sync-component-props.ts` additionally reads each component's `componentKey` frontmatter and joins it with `@vaneui/ui`'s exported metadata to produce `resources/component-props.json`. It marks a prop as shared (`isCommon`) when its category is in `vaneui-web/app/docs/commonCategories.ts`, the same split the props tables on vaneui.com use.

### Building

Everything in this repo is TypeScript. `src/` compiles to `dist/`, which is what the npm package ships. The sync scripts in `scripts/` and the tests in `test/` are `.ts` files that Node 24 runs directly (type stripping), so they need no build step.

The published server is plain JavaScript and runs on Node 20 and later (`engines.node`). Working on this repo (the sync scripts and the tests) needs **Node 24**, which is also what CI uses.

`resources/` is **committed to git**, so a fresh clone already has everything the server needs to run.

```bash
npm install
npm run build       # compile src/ to dist/ (tsconfig.build.json), using the committed resources/
npm run typecheck   # type-check src/, scripts/ and test/ (tsconfig.json)
npm start           # run the built server over stdio
```

Point a client at the local build with `node /absolute/path/to/vaneui-mcp/dist/server.js` as the command.

### Testing

`npm test` compiles `src/`, type-checks the whole repo and runs the tests in `test/` with `node --test` against the compiled `dist/` and the committed `resources/`. They cover search ranking, page parsing, the three tools through a real MCP client (in memory and over stdio against `dist/server.js`), the sync allow-list and the declared Node range.

`.github/workflows/test.yml` runs `npm ci` and `npm test` on every pull request and on pushes to `main`.

### Re-syncing the corpus (maintainers)

`.github/workflows/sync-corpus.yml` re-syncs the corpus once a day (and on manual dispatch) from the `main` branches of vaneui/vaneui and vaneui/web. It runs the strict sync and the tests, and when `resources/` changed it opens one pull request from the `chore/sync-corpus` branch, or updates the open one. Review that the diff is content drift only, then merge. It needs the repository setting **Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests"**. Checks do not start by themselves on a pull request that GitHub Actions opened: close and reopen it to run them (the workflow has already run the tests on that corpus).

To re-sync by hand, the sync scripts expect `vaneui/` and `vaneui-web/` as **sibling folders** of this repo (resolved as `../vaneui` and `../vaneui-web`). Override with `VANEUI_PATH` / `VANEUI_WEB_PATH` env vars if they live elsewhere. Build `vaneui/` first (`npm ci && npm run build`), because the prop table is read from its `dist/`, and run `npm install` in `vaneui-web/`, because its include helper loads `@vaneui/md` from there. A missing or cyclic include stops the sync.

```bash
npm run build:full  # re-sync resources/ from the sibling repos, then build
```

- `npm run sync` — lenient sync: copies the allow-listed vaneui material and every docs page into `resources/` and writes `component-props.json`. ⚠️ Wipes `resources/` first; if a sibling repo is missing you'll get a partial bundle. Prefer `build:full`.
- `npm run sync:strict` — strict sync: exits non-zero if any sibling repo is missing, no MD files are found, or an allow-listed rule file or `CLAUDE.md` section is gone. Used by `prepublishOnly` and by the sync workflow.

### Adding or updating a doc

1. Edit (or create) the source markdown in `vaneui/` or `vaneui-web/`:
   - Component reference: `vaneui-web/app/docs/data/<category>/<slug>.md` (with frontmatter).
   - Narrative guide: `vaneui-web/app/docs/data/{getting-started,customization,reference}/`.
   - Usage rule: `vaneui/.claude/rules/<slug>.md`. A new file ships only after its name is added to `CONSUMER_RULE_FILES` in `scripts/consumer-docs.ts`; a new `CLAUDE.md` section only after its title is added to `CONSUMER_CLAUDE_SECTIONS`.
2. `npm run build:full` to regenerate `resources/` and recompile, or wait for the sync workflow's pull request.
3. Commit the regenerated `resources/` alongside the source edit, and restart your MCP client.

Record anything a user of the server will notice in [CHANGELOG.md](./CHANGELOG.md).

`src/resources.ts` reads the resources directory at startup, so no registry edit is needed when adding a file.

## License

[MIT](./LICENSE)
