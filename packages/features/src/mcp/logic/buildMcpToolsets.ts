import { QPQConfig } from '@qpqjs/core';

import { getAllMcpToolsetConfigs } from '../config/logic/getAllMcpToolsetConfigs';
import { McpToolset } from '../models/McpToolset';

/** Every defineMcpToolset in the service. */
export const buildMcpToolsets = (qpqConfig: QPQConfig): McpToolset[] => getAllMcpToolsetConfigs(qpqConfig).map(({ toolset }) => toolset);
