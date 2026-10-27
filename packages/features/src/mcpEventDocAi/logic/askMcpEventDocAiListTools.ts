import { AskResponse } from 'quidproquo-core';

import { McpTool } from '../../mcp/models/McpTool';
import { askMcpEventDocAiOfferedRead } from './askMcpEventDocAiOfferedRead';
import { buildMcpEventDocAiToolBindings } from './buildMcpEventDocAiToolBindings';

/** The toolset's listTools: listDocs plus every eventDoc AI tool in the service it offers. */
export function* askMcpEventDocAiListTools(): AskResponse<McpTool[]> {
  const eventDocAis = yield* askMcpEventDocAiOfferedRead();

  return buildMcpEventDocAiToolBindings(eventDocAis).map(({ tool }) => tool);
}
