# @vaneui/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the VaneUI documentation as MCP resources. Any MCP-aware client (Claude Code, Cursor, VS Code, Copilot CLI, etc.) can read these docs on demand and search across them with a single tool call, so you don't have to paste rules into prompts by hand.

## Sources

Docs come from two sibling repos and are bundled at build time:

- **`vaneui/`** — API reference and agent-facing rules (`CLAUDE.md` + `.claude/rules/*.md`). Describe how VaneUI is built internally and how AI agents should work with its source.
- **`vaneui-web/`** — narrative guides and per-component reference, all authored as plain markdown under `app/docs/data/**/*.md` (one file per component, with frontmatter).

Each `.md` file is copied verbatim into `resources/` keyed by its basename. Filenames are globally unique across categories, so the corpus is flat: `resources/button.md`, `resources/installation.md`, `resources/common-props.md`, etc. The MCP URI for each resource is `vaneui://docs/<basename-without-.md>`.

## Local dev usage

The `resources/` folder (the bundled doc corpus) is **committed to git**, so a fresh clone already has everything the server needs to run. You only need to re-sync when you've edited the upstream doc sources.

**Standalone build (for anyone who cloned or forked this repo):**

```bash
cd C:/GitHub/vaneui-mcp
npm install
npm run build           # just tsc — uses the committed resources/
```

**Full rebuild (for maintainers who also have `vaneui/` and `vaneui-web/` as sibling folders):**

```bash
npm run build:full      # re-sync resources/ from sibling repos, then tsc
```

The full rebuild needs `../vaneui/` and `../vaneui-web/` checked out next to this repo. Override the defaults with `VANEUI_PATH` / `VANEUI_WEB_PATH` env vars if they live elsewhere.

Point your MCP client at the built server. For clients that consume a `mcp.json`-style config:

```json
{
  "mcpServers": {
    "vaneui": {
      "command": "node",
      "args": ["C:/GitHub/vaneui-mcp/dist/server.js"]
    }
  }
}
```

## Post-publish usage (`npx`)

Once published to npm, any MCP client can spawn the server without a local clone:

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

## How to add or update docs

Single mechanism — edit the source markdown, then re-sync.

### Adding a new doc

1. Create the markdown in the appropriate source repo:
   - **Component reference:** `vaneui-web/app/docs/data/<category>/<slug>.md` (with frontmatter — see existing pages for the schema).
   - **Narrative guide:** `vaneui-web/app/docs/data/getting-started/` or `customization/` or `reference/`.
   - **Agent rule:** `vaneui/.claude/rules/<slug>.md`.
2. From this repo: `npm run sync` (or `npm run build:full` to also recompile).
3. Restart your MCP client. The new resource is available at `vaneui://docs/<slug>` (slug = filename without `.md`).

`src/resources.ts` reads the resources directory at module init, so no registry edit is required.

### Updating a doc

1. Edit the source MD in `vaneui/` or `vaneui-web/`.
2. `npm run sync`. The corpus is regenerated.
3. Restart your MCP client.

## Development

The sync script expects `vaneui/` and `vaneui-web/` as **sibling folders** of this repo (so paths resolve to `../vaneui` and `../vaneui-web` from the package root). Override with `VANEUI_PATH=/path/to/vaneui` / `VANEUI_WEB_PATH=/path/to/vaneui-web` env vars if they live elsewhere.

- `npm run build` — just `tsc`. Uses the committed `resources/`. Works standalone, no sibling repos required.
- `npm run build:full` — runs the lenient sync then `tsc`. Regenerates `resources/` from sibling repos; commit the diff afterwards.
- `npm run sync` — lenient sync. Copies every `.md` from both sources into `resources/` (and writes `component-props.json`). If a sibling repo is missing, warns and skips. ⚠️ The sync wipes `resources/` before it starts — if a sibling repo is missing, you'll end up with an empty or partial bundle. Prefer `build:full` when you want to regenerate.
- `npm run sync:strict` — strict sync. Exits with code 1 if any sibling repo is missing or no MD files are found. Used by `prepublishOnly` so we never ship a tarball with partial docs.

## Available resources

The corpus contains every `.md` in `vaneui/CLAUDE.md`, `vaneui/.claude/rules/`, and `vaneui-web/app/docs/data/**`. Each shows up as a resource named `vaneui://docs/<slug>` where `<slug>` is the source filename minus the `.md` extension.

Examples:

- `vaneui://docs/claude` — VaneUI project overview (`CLAUDE.md`).
- `vaneui://docs/component-usage`, `vaneui://docs/prop-to-tailwind-mapping`, `vaneui://docs/component-patterns`, `vaneui://docs/props-and-theme`, `vaneui://docs/css-conventions`, `vaneui://docs/testing`, `vaneui://docs/e2e-testing`, `vaneui://docs/playground-examples` — agent-facing rule files.
- `vaneui://docs/installation`, `vaneui://docs/usage-basics`, `vaneui://docs/core-concepts` — getting-started guides.
- `vaneui://docs/theming-overview`, `vaneui://docs/using-theme-provider`, `vaneui://docs/theme-defaults`, `vaneui://docs/theme-and-override`, `vaneui://docs/extra-classes`, `vaneui://docs/customizing-styles`, `vaneui://docs/variant-inheritance`, `vaneui://docs/css-variables` — customization guides.
- `vaneui://docs/common-props` — shared layout/typography prop reference.
- `vaneui://docs/button`, `vaneui://docs/card`, `vaneui://docs/modal`, ... — one per component.

All resources have `mimeType: text/markdown`.

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
