/**
 * A pluggable source of MCP tools: two inline functions the server calls. `listTools` gets McpToolsetListToolsInput and
 * returns McpTool[]; `runTool` gets McpToolsetRunToolInput and returns the tool's result. The toolset sets up whatever
 * context its tools need. It already runs as the caller, with whatever context the route's auth resolved (a tenant's storage scope, say).
 */
export type McpToolset = {
  // Unique per service; names the toolset in config and logs.
  name: string;
  listTools: string;
  runTool: string;
  // Added to the server's `instructions` on initialize.
  instructions?: string;
  // Every tool this toolset lists is named `${prefix}_…`, so a call to such a name goes straight to its runTool
  // without listing every toolset first (a remote toolset would otherwise cost a hop per service on every call).
  prefix?: string;
};
