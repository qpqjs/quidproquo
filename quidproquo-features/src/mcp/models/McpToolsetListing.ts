import { McpTool } from './McpTool';
import { McpToolset } from './McpToolset';

/** One toolset with the tools its `listTools` returned for this request. */
export type McpToolsetListing = {
  toolset: McpToolset;
  tools: McpTool[];
};
