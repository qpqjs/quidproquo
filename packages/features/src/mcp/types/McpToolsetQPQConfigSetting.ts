import { QPQConfigSetting } from '@qpqjs/core';

import { McpToolset } from '../models/McpToolset';

/** defineMcpToolset's setting, read back at runtime by the ReadConfig processor. */
export type McpToolsetQPQConfigSetting = QPQConfigSetting & {
  toolset: McpToolset;
};
