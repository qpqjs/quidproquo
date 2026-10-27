import { Nullable } from '@qpqjs/core';

import { MCP_REMOTE_TOOL_NAME_SEPARATOR } from '../constants/mcpRemoteToolNameSeparator';

/** The exporting service's own name for a prefixed tool, or null when the name does not carry this prefix. */
export const parseMcpRemoteToolName = (prefix: string, name: string): Nullable<string> => {
  const start = `${prefix}${MCP_REMOTE_TOOL_NAME_SEPARATOR}`;

  return name.startsWith(start) && name.length > start.length ? name.slice(start.length) : null;
};
