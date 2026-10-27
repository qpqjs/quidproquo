import { AiToolDefinition } from 'quidproquo-core';

import { McpToolset } from './McpToolset';

/** Everything the MCP handler needs from config, resolved by the ReadConfig processor. */
export type McpConfig = {
  serverName: string;
  tools: AiToolDefinition[];
  toolsets: McpToolset[];
};
