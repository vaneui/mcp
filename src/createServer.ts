import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getDoc } from "./getDoc.js";
import { DOCS, URI_PREFIX, findDoc, readDoc, slugFromUri, uriFor } from "./resources.js";
import { DEFAULT_LIMIT, MAX_PER_PAGE, MAX_RESULTS, searchDocs } from "./search.js";
import { formatComponentProps } from "./tools.js";

function readPackageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgPath = resolve(here, "..", "package.json");
  const raw = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
  return raw.version ?? "0.0.0";
}

/** The VaneUI server with its resources and tools registered, not yet connected to a transport. */
export function createServer(): McpServer {
  const server = new McpServer(
    { name: "vaneui", version: readPackageVersion() },
    { capabilities: { resources: {}, tools: {} } },
  );

  // Register every synced markdown file as a static MCP resource.
  for (const doc of DOCS) {
    server.registerResource(
      doc.slug,
      uriFor(doc.slug),
      {
        title: doc.name,
        description: doc.description,
        mimeType: "text/markdown",
      },
      async (uri: URL) => {
        const slug = slugFromUri(uri.toString());
        const entry = slug ? findDoc(slug) : undefined;
        if (!entry) {
          throw new Error(
            `Unknown VaneUI doc: ${uri.toString()}. Expected a URI under ${URI_PREFIX}.`,
          );
        }
        const text = await readDoc(entry);
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/markdown",
              text,
            },
          ],
        };
      },
    );
  }

  server.registerTool(
    "search_docs",
    {
      description:
        "Search the VaneUI docs (component pages, guides, usage rules, prop-to-Tailwind mapping). Give a few words or an exact name such as `themeDefaults`. Results are doc sections, best first: sections that hold every word come before sections that hold some, and a word in a heading or page title counts more than one in the text. Returns a JSON array of up to `limit` sections, each with `slug`, `section`, `heading`, `lineNumber` and a short `snippet`, and says when more sections matched than were returned. Pass a result's `slug` and `section` to get_doc to read that section. Use this before guessing prop names, defaults, or class mappings.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Words or a name to search for (case-insensitive)."),
        regex: z
          .boolean()
          .optional()
          .describe("If true, interpret `query` as a JavaScript regex, matched line by line. Defaults to false (words)."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_RESULTS)
          .optional()
          .describe(`Most sections to return. Defaults to ${DEFAULT_LIMIT}.`),
      },
    },
    async ({ query, regex, limit }) => {
      try {
        const { hits, total } = await searchDocs({ query, regex, limit });
        if (hits.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No matches for "${query}" across ${DOCS.length} VaneUI docs.`,
              },
            ],
          };
        }
        const content: { type: "text"; text: string }[] = [
          {
            type: "text",
            text: JSON.stringify(hits, null, 2),
          },
        ];
        if (total > hits.length) {
          content.push({
            type: "text",
            text: `Showing the best ${hits.length} of ${total} matching sections (at most ${MAX_PER_PAGE} per page). Narrow the query or raise \`limit\` (up to ${MAX_RESULTS}) to see others.`,
          });
        }
        return { content };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `search_docs failed: ${message}` }],
        };
      }
    },
  );

  server.registerTool(
    "get_doc",
    {
      description:
        "Read a VaneUI docs page. With only `slug` it returns the page's intro and the list of its sections; with `section` it returns that section in full, code examples included. Call search_docs first when you do not know which page or section holds the answer: each of its results has the `slug` and `section` to pass here. Component pages (`button`, `modal`, `field`, ...) hold what get_component_props does not list: value props such as `open` and `onClose` or `label` and `error`, sub-components and examples.",
      inputSchema: {
        slug: z
          .string()
          .min(1)
          .describe(
            "Page slug, e.g. `modal` or `theme-defaults`. Case, a `.md` ending and a path before the name are ignored, so a component name (`IconButton`), a resource URI or a docs link (`/docs/overlay-components/modal#sizes`) works too.",
          ),
        section: z
          .string()
          .optional()
          .describe(
            "Section id from the page's section list or from a search_docs result, or the heading text. Leave out for the intro and the section list.",
          ),
      },
    },
    async ({ slug, section }) => {
      try {
        const text = await getDoc({ slug, section });
        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `get_doc failed: ${message}` }],
        };
      }
    },
  );

  server.registerTool(
    "get_component_props",
    {
      description:
        "Return a VaneUI component's boolean props, one line per category, default marked `*`. By default (`compact`) it lists the component's own props and names the shared layout categories it takes; slug `common` lists those once. detail `full` adds descriptions and every shared prop. Value props such as `label` or `title` are on the component's page: call get_doc with the same slug. The slug is the resource basename: `button`, `card`, `icon-button`, etc.",
      inputSchema: {
        slug: z
          .string()
          .min(1)
          .describe("Component slug, or `common` for the shared layout props."),
        detail: z
          .enum(["compact", "full"])
          .optional()
          .describe("`compact` (default) or `full`."),
      },
    },
    async ({ slug, detail }) => {
      try {
        const text = await formatComponentProps({ slug, detail });
        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `get_component_props failed: ${message}` }],
        };
      }
    },
  );

  return server;
}
