import { AskResponse } from '@qpqjs/core';

import { McpToolsetRunToolInput } from '../../../mcp/models/McpToolsetRunToolInput';
import { askMcpEventDocAiRunTool } from '../../logic/askMcpEventDocAiRunTool';

/** The eventDoc AI toolset's runTool inline function. */
export function* mcpEventDocAiRunTool(input: McpToolsetRunToolInput): AskResponse<unknown> {
  return yield* askMcpEventDocAiRunTool(input);
}
