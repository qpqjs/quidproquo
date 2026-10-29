import { Nullable, QPQConfig } from '@qpqjs/core';

import { getMcpServerConfig } from '../config/logic/getMcpServerConfig';
import { McpConfig } from '../models/McpConfig';
import { buildMcpToolsets } from './buildMcpToolsets';

/** defineMcpServer's setting plus every defineMcpToolset in the service. Null without defineMcpServer. */
export const buildMcpConfig = (qpqConfig: QPQConfig): Nullable<McpConfig> => {
  const server = getMcpServerConfig(qpqConfig);
  if (!server) {
    return null;
  }

  return {
    serverName: server.serverName,
    tools: server.tools,
    toolsets: buildMcpToolsets(qpqConfig),
  };
};
