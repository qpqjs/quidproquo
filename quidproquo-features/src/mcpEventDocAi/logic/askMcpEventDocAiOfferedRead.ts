import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { askMcpEventDocAiReadConfig } from '../actions/askMcpEventDocAiReadConfig';
import { MCP_EVENT_DOC_AI_EXCLUDED_TOOLS_GLOBAL } from '../constants/mcpEventDocAiExcludedToolsGlobal';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { withoutMcpEventDocAiTools } from './withoutMcpEventDocAiTools';

/** The service's eventDoc AIs with only the tools this toolset offers: its `excludeTools` removed, before any naming. */
export function* askMcpEventDocAiOfferedRead(): AskResponse<McpEventDocAi[]> {
  const eventDocAis = yield* askMcpEventDocAiReadConfig();
  const excludedToolNames = yield* askConfigGetGlobal<string[]>(MCP_EVENT_DOC_AI_EXCLUDED_TOOLS_GLOBAL);

  return withoutMcpEventDocAiTools(eventDocAis, excludedToolNames);
}
