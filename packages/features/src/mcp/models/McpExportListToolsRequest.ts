import { HTTPEvent } from 'quidproquo-webserver';

/** What the mcpExportListTools service function receives: the MCP request, without its credentials. */
export type McpExportListToolsRequest = {
  event: HTTPEvent;
};
