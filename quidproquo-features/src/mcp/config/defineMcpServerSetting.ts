import { MCP_SERVER_CONFIG_SETTING_TYPE } from '../constants/mcpServerConfigSettingType';
import { McpServerOptions } from '../types/McpServerOptions';
import { McpServerQPQConfigSetting } from '../types/McpServerQPQConfigSetting';

/** defineMcpServer's own setting, which the ReadConfig processor reads back at runtime. */
export const defineMcpServerSetting = ({ serverName = 'qpq', tools = [] }: McpServerOptions): McpServerQPQConfigSetting => ({
  configSettingType: MCP_SERVER_CONFIG_SETTING_TYPE,
  uniqueKey: serverName,

  serverName,
  tools,
});
