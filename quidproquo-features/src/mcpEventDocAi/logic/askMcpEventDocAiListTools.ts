import { AskResponse } from 'quidproquo-core';

import { McpTool } from '../../mcp/models/McpTool';
import { askMcpEventDocAiReadConfig } from '../actions/askMcpEventDocAiReadConfig';
import { buildMcpEventDocAiToolBindings } from './buildMcpEventDocAiToolBindings';

/** The toolset's listTools: listDocs plus every eventDoc AI tool in the service. */
export function* askMcpEventDocAiListTools(): AskResponse<McpTool[]> {
  const eventDocAis = yield* askMcpEventDocAiReadConfig();

  return buildMcpEventDocAiToolBindings(eventDocAis).map(({ tool }) => tool);
}
