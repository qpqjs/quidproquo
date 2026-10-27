import { MCP_TOOLSET_CONFIG_SETTING_TYPE } from '../constants/mcpToolsetConfigSettingType';
import { McpToolset } from '../models/McpToolset';
import { McpToolsetQPQConfigSetting } from '../types/McpToolsetQPQConfigSetting';

/** Offers a toolset's tools on this service's MCP server. Its two inline functions must be registered separately. */
export const defineMcpToolset = (toolset: McpToolset): McpToolsetQPQConfigSetting => ({
  configSettingType: MCP_TOOLSET_CONFIG_SETTING_TYPE,
  uniqueKey: toolset.name,

  toolset,
});
