import { createActionRequester } from '@qpqjs/core';

import { McpConfig } from '../models/McpConfig';
import { McpActionType } from './McpActionType';

/** The service's MCP server settings and its toolsets, read from config at runtime. Throws NotFound without defineMcpServer. */
export const askMcpReadConfig = createActionRequester<McpConfig>()({
  actionType: McpActionType.ReadConfig,
});
