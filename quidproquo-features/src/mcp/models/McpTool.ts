/** A tool as `tools/list` describes it. */
export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};
