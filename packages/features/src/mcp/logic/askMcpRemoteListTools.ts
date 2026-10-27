import { askCatch, askLogCreate, AskResponse, LogLevelEnum } from '@qpqjs/core';
import { askServiceFunctionExecute } from '@qpqjs/webserver';

import { MCP_EXPORT_LIST_TOOLS_FN } from '../constants/mcpExportListToolsFn';
import { McpExportListToolsRequest } from '../models/McpExportListToolsRequest';
import { McpTool } from '../models/McpTool';
import { McpToolsetListToolsInput } from '../models/McpToolsetListToolsInput';
import { askMcpRemoteTargetRead } from './askMcpRemoteTargetRead';
import { buildMcpForwardedEvent } from './buildMcpForwardedEvent';
import { buildMcpRemoteToolName } from './buildMcpRemoteToolName';

/**
 * A remote toolset's listTools: the exporting service's tools, each name prefixed. A service that cannot answer is
 * logged and offers no tools, so one service being down never takes the whole server with it.
 */
export function* askMcpRemoteListTools({ event }: McpToolsetListToolsInput): AskResponse<McpTool[]> {
  const { service, prefix } = yield* askMcpRemoteTargetRead();

  const listed = yield* askCatch(
    askServiceFunctionExecute<McpTool[], McpExportListToolsRequest>(service, MCP_EXPORT_LIST_TOOLS_FN, { event: buildMcpForwardedEvent(event) }),
  );
  if (!listed.success) {
    yield* askLogCreate(LogLevelEnum.Warn, `MCP remote toolset "${prefix}": ${service} did not list its tools: ${listed.error.errorText}`);
    return [];
  }

  return listed.result.map((tool) => ({ ...tool, name: buildMcpRemoteToolName(prefix, tool.name) }));
}
