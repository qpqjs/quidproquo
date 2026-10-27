import { AskResponse } from 'quidproquo-core';

import { askMcpRemoteListTools } from '../../logic/askMcpRemoteListTools';
import { McpTool } from '../../models/McpTool';
import { McpToolsetListToolsInput } from '../../models/McpToolsetListToolsInput';

/** A remote toolset's listTools inline function; which remote comes from its runtime globals. */
export function* mcpRemoteListTools(input: McpToolsetListToolsInput): AskResponse<McpTool[]> {
  return yield* askMcpRemoteListTools(input);
}
