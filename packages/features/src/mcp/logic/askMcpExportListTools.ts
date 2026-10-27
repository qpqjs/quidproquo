import { AskResponse } from 'quidproquo-core';

import { askMcpReadToolsets } from '../actions/askMcpReadToolsets';
import { McpExportListToolsRequest } from '../models/McpExportListToolsRequest';
import { McpTool } from '../models/McpTool';
import { askMcpToolBindingsBuild } from './askMcpToolBindingsBuild';

/** The tools of every toolset this service exports, as one list (first name wins on a clash, as on a server). */
export function* askMcpExportListTools({ event }: McpExportListToolsRequest): AskResponse<McpTool[]> {
  const toolsets = yield* askMcpReadToolsets();
  const bindings = yield* askMcpToolBindingsBuild([], toolsets, event);

  return bindings.map(({ tool }) => tool);
}
