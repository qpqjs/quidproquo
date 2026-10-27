import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { MCP_TOOLSET_CONFIG_SETTING_TYPE } from '../constants/mcpToolsetConfigSettingType';
import { McpToolset } from '../models/McpToolset';
import { McpToolsetQPQConfigSetting } from '../types/McpToolsetQPQConfigSetting';

/** Every defineMcpToolset in the service. */
export const buildMcpToolsets = (qpqConfig: QPQConfig): McpToolset[] =>
  qpqCoreUtils.getConfigSettings<McpToolsetQPQConfigSetting>(qpqConfig, MCP_TOOLSET_CONFIG_SETTING_TYPE).map(({ toolset }) => toolset);
