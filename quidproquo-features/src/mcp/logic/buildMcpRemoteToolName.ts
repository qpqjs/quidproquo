import { MCP_REMOTE_TOOL_NAME_SEPARATOR } from '../constants/mcpRemoteToolNameSeparator';

/** A remote tool's name as this server offers it: `template` + `setLayout` is `template_setLayout`. */
export const buildMcpRemoteToolName = (prefix: string, name: string): string => `${prefix}${MCP_REMOTE_TOOL_NAME_SEPARATOR}${name}`;
