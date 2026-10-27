import { Nullable, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { MCP_SERVER_CONFIG_SETTING_TYPE } from '../constants/mcpServerConfigSettingType';
import { McpConfig } from '../models/McpConfig';
import { McpServerQPQConfigSetting } from '../types/McpServerQPQConfigSetting';
import { buildMcpToolsets } from './buildMcpToolsets';

/** defineMcpServer's setting plus every defineMcpToolset in the service. Null without defineMcpServer. */
export const buildMcpConfig = (qpqConfig: QPQConfig): Nullable<McpConfig> => {
  const server = qpqCoreUtils.getConfigSetting<McpServerQPQConfigSetting>(qpqConfig, MCP_SERVER_CONFIG_SETTING_TYPE);
  if (!server) {
    return null;
  }

  return {
    serverName: server.serverName,
    tools: server.tools,
    toolsets: buildMcpToolsets(qpqConfig),
  };
};
