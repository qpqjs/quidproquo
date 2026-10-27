import { AskResponse } from 'quidproquo-core';
import { ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

import { askMcpExportListTools } from '../../logic/askMcpExportListTools';
import { McpExportListToolsRequest } from '../../models/McpExportListToolsRequest';
import { McpTool } from '../../models/McpTool';

/** The mcpExportListTools service function (MCP_EXPORT_LIST_TOOLS_FN). */
export function* mcpExportListTools(event: ExecuteServiceFunctionEvent<McpExportListToolsRequest>): AskResponse<McpTool[]> {
  return yield* askMcpExportListTools(event.payload);
}
