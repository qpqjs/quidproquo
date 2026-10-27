import { AiToolDefinition, QPQConfigSetting } from 'quidproquo-core';

/** defineMcpServer's setting, read back at runtime by the ReadConfig processor. */
export type McpServerQPQConfigSetting = QPQConfigSetting & {
  serverName: string;
  tools: AiToolDefinition[];
};
