import { createActionRequester } from '@qpqjs/core';

import { McpToolset } from '../models/McpToolset';
import { McpActionType } from './McpActionType';

/** Every defineMcpToolset in this service, read from config at runtime. For a service that exports its toolsets with no MCP server of its own. */
export const askMcpReadToolsets = createActionRequester<McpToolset[]>()({
  actionType: McpActionType.ReadToolsets,
});
