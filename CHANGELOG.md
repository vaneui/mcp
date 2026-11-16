# Changelog

All notable changes to `@vaneui/mcp` are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
package follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The entries up
to 1.2.0 were written from the commit history, and their dates are the dates of the release
commits.

## Unreleased

Search that ranks its results, a tool that reads a docs page, a corpus that holds only what
helps a project using VaneUI, and a wider Node range.

### Added

- `get_doc` tool. `get_doc(slug)` returns a page's intro and the list of its sections, and
  `get_doc(slug, section)` returns one section in full, subsections and code examples
  included. Before, no tool returned a docs page: a client without resource support could
  only read the snippets `search_docs` gave it.
- `get_doc` and `get_component_props` take the slug the way a model meets it: a component
  name (`IconButton`), a file name (`icon-button.md`), a docs link or a resource URI. A docs
  link with a `#fragment` opens that section. An unknown page, section or component comes
  back with the closest names before the full list.
- `search_docs` takes an optional `limit` (1 to 50, 10 by default).
- Two docs pages from the re-sync: `ai-assistants` and `nextjs`.

### Changed

- `search_docs` returns doc sections, best first, instead of the first 50 matching lines in
  file order. The query is split into words. Sections that hold every word come before
  sections that hold some, and a word in a heading or page title counts more than one in the
  text. A query with several words no longer has to appear as one exact string, so "modal
  focus trap" finds the Modal page, and `themeDefaults` finds the Theme Defaults guide first.
- Each `search_docs` result has `slug`, `section` and `heading` next to `uri`, `lineNumber`
  and `snippet`. Pass `slug` and `section` to `get_doc` to read the section. A list holds at
  most 3 sections of one page, and a second text block says how many sections matched when
  the list was cut.
- The corpus holds an allow-list of consumer-facing material from the vaneui repo: the usage
  guide, the prop-to-Tailwind mapping and five sections of the project overview. A new rule
  file or overview section stays out until it is added to the list.
- `engines.node` is `>=20` (was `24.x`), so `npx @vaneui/mcp` no longer warns or fails on
  Node 20, 22 and versions after 24.
- The corpus is re-synced from the current docs. A scheduled workflow now re-syncs it daily
  and opens a pull request when the docs changed.

### Removed

- The resources `vaneui://docs/component-patterns`, `css-conventions`, `e2e-testing`,
  `naming-law`, `playground-examples`, `props-and-theme` and `testing`, and the contributor
  sections of `vaneui://docs/claude`. They are rules for working on the library itself (its
  verification pipeline, release policy, tests and theme internals) and steered agents in
  projects that only use VaneUI.

### Fixed

- `zod` is a declared dependency. The server imports it, but it was installed only because
  the MCP SDK depends on it.

### Security

- `@modelcontextprotocol/sdk` raised from `^1.29.0` to `^1.32.2` and the locked dependencies
  under it refreshed. `npm audit` reported 10 vulnerabilities before (1 critical, 6 high,
  3 moderate) and reports none now.

## 1.2.0

`2026-11-02`

### Changed

- `get_component_props` returns plain text, one line per category with the default marked,
  instead of every prop row as JSON. By default it lists the component's own props and names
  the shared layout categories and defaults the component takes. Slug `common` lists the
  shared layout props once, and detail `full` adds descriptions and the shared props.
- The split between a component's own props and the shared ones is read from the docs site,
  so it matches the props tables on vaneui.com.

## 1.1.5

`2026-10-31`

### Changed

- Docs corpus re-synced for `@vaneui/ui` 1.5.0.

## 1.1.4

`2026-10-29`

### Changed

- Docs corpus re-synced for `@vaneui/ui` 1.4.6.

### Fixed

- The `claude` resource leaves out the vaneui repo's contributor rules.

## 1.1.3

`2026-10-29`

### Added

- The server is published to the official MCP Registry as `io.github.vaneui/mcp` on stable
  releases.

### Changed

- The sync expands the `{% include %}` tags of docs pages and leaves partials out of the
  corpus.
- Docs corpus re-synced for `@vaneui/ui` 1.4.5.

## 1.1.2

`2026-10-11`

### Changed

- Docs corpus re-synced for `@vaneui/ui` 1.4.4.

## 1.1.1

`2026-09-30`

### Changed

- Docs corpus re-synced for `@vaneui/ui` 1.4.1 to 1.4.3.
- The package is published to npm with trusted publishing.

## 1.1.0

`2026-08-18`

### Added

- Eight component pages: Field, Alert, Spinner, Tooltip, Textarea, Select, Radio and Switch.
  The prop table covers 41 components.

## 1.0.0

`2026-08-16`

First release on the version line shared with `@vaneui/ui` and `@vaneui/md`. The server
exposes the VaneUI docs as `vaneui://docs/<slug>` resources and has two tools, `search_docs`
and `get_component_props`.
