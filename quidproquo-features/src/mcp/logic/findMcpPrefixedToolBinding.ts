import { Nullable } from 'quidproquo-core';

import { McpToolBinding } from '../models/McpToolBinding';
import { McpToolKind } from '../models/McpToolKind';
import { McpToolset } from '../models/McpToolset';
import { parseMcpRemoteToolName } from './parseMcpRemoteToolName';

/**
 * The binding for a call whose name carries a toolset's prefix, without listing anything. Its schema is not known
 * here and running does not need it; a name the toolset does not have fails in its runTool, as a tool error.
 */
export const findMcpPrefixedToolBinding = (toolsets: McpToolset[], name: string): Nullable<McpToolBinding> => {
  const toolset = toolsets.find(({ prefix }) => prefix && parseMcpRemoteToolName(prefix, name));

  return toolset ? { kind: McpToolKind.Toolset, runTool: toolset.runTool, tool: { name, description: '', inputSchema: {} } } : null;
};
