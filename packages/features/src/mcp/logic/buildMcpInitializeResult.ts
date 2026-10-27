import { MCP_SERVER_VERSION } from '../constants/mcpServerVersion';
import { MCP_SUPPORTED_PROTOCOL_VERSIONS } from '../constants/mcpSupportedProtocolVersions';
import { McpConfig } from '../models/McpConfig';
import { buildMcpInstructions } from './buildMcpInstructions';

/** The `initialize` reply. Echoes the client's protocol version when supported, else offers our newest. */
export const buildMcpInitializeResult = (requestedVersion: unknown, config: McpConfig) => ({
  protocolVersion:
    typeof requestedVersion === 'string' && MCP_SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
      ? requestedVersion
      : MCP_SUPPORTED_PROTOCOL_VERSIONS[0],
  capabilities: { tools: {} },
  serverInfo: { name: config.serverName, version: MCP_SERVER_VERSION },
  instructions: buildMcpInstructions(config),
});
