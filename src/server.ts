#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./createServer.js";
import { ensureResourcesDir } from "./resources.js";

async function main(): Promise<void> {
  await ensureResourcesDir();
  await createServer().connect(new StdioServerTransport());
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("vaneui-mcp failed to start:", err);
  process.exit(1);
});
