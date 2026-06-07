# @vaneui/mcp

[![npm version](https://img.shields.io/npm/v/@vaneui/mcp?color=cb3837&logo=npm)](https://www.npmjs.com/package/@vaneui/mcp)
[![license](https://img.shields.io/npm/l/@vaneui/mcp)](./LICENSE)
[![Model Context Protocol](https://img.shields.io/badge/MCP-server-blue)](https://modelcontextprotocol.io)

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the [VaneUI](https://vaneui.com) documentation to AI coding agents. Any MCP-aware client (Claude Code, Claude Desktop, Cursor, VS Code, etc.) can read the component docs on demand and search across them with a single tool call, so your agent writes correct VaneUI code without you pasting rules into prompts by hand.

It serves the full component reference, getting-started and customization guides, and a structured prop table for every component, plus two tools: `search_docs` and `get_component_props`.

## Requirements

- **Node.js 24** (the `npx` command below downloads and runs the server for you).

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
- *"How do I set app-wide defaults for every Button?"* → `search_docs` finds the `theme-defaults` guide and shows the `ThemeProvider themeDefaults` pattern.
- *"Which VaneUI prop maps to `flex-1`?"* → `search_docs` finds it in the prop-to-Tailwind mapping.

## Verifying it works

After adding the server and restarting your client:

- The client should list a server named **`vaneui`** with the tools `search_docs` and `get_component_props` (and the `vaneui://docs/*` resources).
- To smoke-test the server directly, run `npx -y @vaneui/mcp` in a terminal. It starts and waits on stdio (no output is normal for an MCP stdio server; press Ctrl+C to exit).

## Tools

### `search_docs`

Substring or regex search across the full doc corpus.

| Param | Type | Notes |
|-------|------|-------|
| `query` | string | Required. Case-insensitive. |
| `regex` | boolean | Optional. If `true`, `query` is parsed as a JavaScript regex. Defaults to `false`. |

Returns up to 50 hits, each containing `uri`, `slug`, `lineNumber`, and a short surrounding `snippet`. Use this before guessing prop names, defaults, or class mappings — the answer is almost always already in the docs.

### `get_component_props`

Returns the structured prop / category / default / description table for a single component, derived directly from `@vaneui/ui`'s `ComponentCategories`, `ComponentKeys`, `defaultTheme`, and `PropDescriptions`.

| Param | Type | Notes |
|-------|------|-------|
| `slug` | string | Required. The component slug, matching the resource basename — e.g. `button`, `card`, `icon-button`, `page-title`. |

Returns a JSON array of `{ prop, category, isDefault, description, isCommon }` rows. Use this when you need the exact prop list for a component (selecting between common layout props vs component-specific props, finding which prop is the default in a category, etc.).

## Available resources

Each documentation file is exposed as a resource named `vaneui://docs/<slug>`, where `<slug>` is the source filename minus the `.md` extension. All resources have `mimeType: text/markdown`.

Examples:

- `vaneui://docs/claude` — VaneUI project overview.
- `vaneui://docs/component-usage`, `vaneui://docs/prop-to-tailwind-mapping`, `vaneui://docs/component-patterns`, `vaneui://docs/props-and-theme`, `vaneui://docs/css-conventions`, `vaneui://docs/testing`, `vaneui://docs/e2e-testing`, `vaneui://docs/playground-examples` — agent-facing rule files.
- `vaneui://docs/installation`, `vaneui://docs/usage-basics`, `vaneui://docs/core-concepts` — getting-started guides.
- `vaneui://docs/theming-overview`, `vaneui://docs/using-theme-provider`, `vaneui://docs/theme-defaults`, `vaneui://docs/theme-and-override`, `vaneui://docs/extra-classes`, `vaneui://docs/customizing-styles`, `vaneui://docs/variant-inheritance`, `vaneui://docs/css-variables` — customization guides.
- `vaneui://docs/common-props` — shared layout/typography prop reference.
- `vaneui://docs/button`, `vaneui://docs/card`, `vaneui://docs/modal`, ... — one per component.

---

## Development

This section is for contributors and maintainers working on the server itself.

### Sources

The doc corpus is bundled from two sibling repos at build time:

- **`vaneui/`** — API reference and agent-facing rules (`CLAUDE.md` + `.claude/rules/*.md`).
- **`vaneui-web/`** — narrative guides and per-component reference, authored as plain markdown under `app/docs/data/**/*.md` (one file per component, with frontmatter).

Each `.md` file is copied verbatim into `resources/` keyed by its basename (filenames are globally unique, so the corpus is flat). `scripts/sync-component-props.mjs` additionally reads each component's `componentKey` frontmatter and joins it with `@vaneui/ui`'s exported metadata to produce `resources/component-props.json`.

### Building

`resources/` is **committed to git**, so a fresh clone already has everything the server needs to run.

```bash
npm install
npm run build       # tsc only — uses the committed resources/
npm start           # run the built server over stdio
```

Point a client at the local build with `node /absolute/path/to/vaneui-mcp/dist/server.js` as the command.

### Re-syncing the corpus (maintainers)

The sync scripts expect `vaneui/` and `vaneui-web/` as **sibling folders** of this repo (resolved as `../vaneui` and `../vaneui-web`). Override with `VANEUI_PATH` / `VANEUI_WEB_PATH` env vars if they live elsewhere.

```bash
npm run build:full  # re-sync resources/ from the sibling repos, then tsc
```

- `npm run sync` — lenient sync: copies every `.md` from both sources into `resources/` and writes `component-props.json`. ⚠️ Wipes `resources/` first; if a sibling repo is missing you'll get a partial bundle. Prefer `build:full`.
- `npm run sync:strict` — strict sync: exits non-zero if any sibling repo is missing or no MD files are found. Used by `prepublishOnly`.

### Adding or updating a doc

1. Edit (or create) the source markdown in `vaneui/` or `vaneui-web/`:
   - Component reference: `vaneui-web/app/docs/data/<category>/<slug>.md` (with frontmatter).
   - Narrative guide: `vaneui-web/app/docs/data/{getting-started,customization,reference}/`.
   - Agent rule: `vaneui/.claude/rules/<slug>.md`.
2. `npm run build:full` to regenerate `resources/` and recompile.
3. Commit the regenerated `resources/` alongside the source edit, and restart your MCP client.

`src/resources.ts` reads the resources directory at startup, so no registry edit is needed when adding a file.

## License

[MIT](./LICENSE)
