import { askInlineFunctionExecute, AskResponse } from '@qpqjs/core';
import { HTTPEvent } from '@qpqjs/webserver';

import { McpToolBinding } from '../models/McpToolBinding';
import { McpToolKind } from '../models/McpToolKind';
import { McpToolsetRunToolInput } from '../models/McpToolsetRunToolInput';

/** Runs one tool call as the caller, in whatever context the route's auth resolved. */
export function* askMcpToolRun(binding: McpToolBinding, event: HTTPEvent, args: Record<string, unknown>): AskResponse<unknown> {
  switch (binding.kind) {
    case McpToolKind.Executor:
      return yield* askInlineFunctionExecute(binding.executor, args);

    case McpToolKind.Toolset:
      return yield* askInlineFunctionExecute<unknown, McpToolsetRunToolInput>(binding.runTool, { name: binding.tool.name, args, event });
  }
}
