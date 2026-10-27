import { AskResponse } from '@qpqjs/core';

import { askMcpRemoteRunTool } from '../../logic/askMcpRemoteRunTool';
import { McpToolsetRunToolInput } from '../../models/McpToolsetRunToolInput';

/** A remote toolset's runTool inline function; which remote comes from its runtime globals. */
export function* mcpRemoteRunTool(input: McpToolsetRunToolInput): AskResponse<unknown> {
  return yield* askMcpRemoteRunTool(input);
}
