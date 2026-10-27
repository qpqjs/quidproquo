import { McpTool } from './McpTool';
import { McpToolKind } from './McpToolKind';

/** A listed tool paired with what running it means. */
export type McpToolBinding = { tool: McpTool } & ({ kind: McpToolKind.Executor; executor: string } | { kind: McpToolKind.Toolset; runTool: string });
