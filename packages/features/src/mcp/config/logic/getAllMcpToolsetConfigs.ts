import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { MCP_TOOLSET_CONFIG_SETTING_TYPE } from '../../constants/mcpToolsetConfigSettingType';
import { McpToolsetQPQConfigSetting } from '../../types/McpToolsetQPQConfigSetting';

/** Every defineMcpToolset in the service. */
export const getAllMcpToolsetConfigs = (qpqConfig: QPQConfig): McpToolsetQPQConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<McpToolsetQPQConfigSetting>(qpqConfig, MCP_TOOLSET_CONFIG_SETTING_TYPE);
