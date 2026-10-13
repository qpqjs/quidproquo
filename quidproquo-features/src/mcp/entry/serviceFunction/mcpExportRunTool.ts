import { AskResponse } from 'quidproquo-core';
import { ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

import { askMcpExportRunTool } from '../../logic/askMcpExportRunTool';
import { McpToolsetRunToolInput } from '../../models/McpToolsetRunToolInput';

/** The mcpExportRunTool service function (MCP_EXPORT_RUN_TOOL_FN). */
export function* mcpExportRunTool(event: ExecuteServiceFunctionEvent<McpToolsetRunToolInput>): AskResponse<unknown> {
  return yield* askMcpExportRunTool(event.payload);
}
