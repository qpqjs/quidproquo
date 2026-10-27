import { AskResponse } from '@qpqjs/core';

import { McpTool } from '../../../mcp/models/McpTool';
import { askMcpEventDocAiListTools } from '../../logic/askMcpEventDocAiListTools';

/** The eventDoc AI toolset's listTools inline function. */
export function* mcpEventDocAiListTools(): AskResponse<McpTool[]> {
  return yield* askMcpEventDocAiListTools();
}
