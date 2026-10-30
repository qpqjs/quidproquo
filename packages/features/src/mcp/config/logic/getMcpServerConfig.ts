import { Nullable, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { MCP_SERVER_CONFIG_SETTING_TYPE } from '../../constants/mcpServerConfigSettingType';
import { McpServerQPQConfigSetting } from '../../types/McpServerQPQConfigSetting';

/** The service's defineMcpServer setting, or null when it exposes no MCP server. */
export const getMcpServerConfig = (qpqConfig: QPQConfig): Nullable<McpServerQPQConfigSetting> =>
  qpqCoreUtils.getConfigSetting<McpServerQPQConfigSetting>(qpqConfig, MCP_SERVER_CONFIG_SETTING_TYPE) ?? null;
