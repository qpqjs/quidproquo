import { McpTool } from '../../mcp/models/McpTool';
import { McpEventDocAi } from './McpEventDocAi';
import { McpEventDocAiToolKind } from './McpEventDocAiToolKind';

/** A tool the eventDoc AI toolset lists, paired with what running it means. */
export type McpEventDocAiToolBinding = { tool: McpTool } & (
  { kind: McpEventDocAiToolKind.ListDocs } | { kind: McpEventDocAiToolKind.Doc; executor: string; eventDocAi: McpEventDocAi }
);
