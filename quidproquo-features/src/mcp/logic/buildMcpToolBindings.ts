import { AiToolDefinition } from 'quidproquo-core';

import { McpToolBinding } from '../models/McpToolBinding';
import { McpToolKind } from '../models/McpToolKind';
import { McpToolsetListing } from '../models/McpToolsetListing';

type ToolWithExecutor = AiToolDefinition & { executor: string };

// A tool with no executor is answered by a chat's browser client, so there is nothing to run here.
const hasExecutor = (tool: AiToolDefinition): tool is ToolWithExecutor => !!tool.executor;

/**
 * Every tool offered and how to run it: the tools run by executor, then each toolset's.
 * Names must be unique; on a clash the earlier tool wins and the later one is not offered.
 */
export const buildMcpToolBindings = (tools: AiToolDefinition[], listings: McpToolsetListing[]): McpToolBinding[] => {
  const executorBindings = tools.filter(hasExecutor).map((tool): McpToolBinding => ({
    kind: McpToolKind.Executor,
    executor: tool.executor,
    tool: { name: tool.name, description: tool.description, inputSchema: tool.inputSchema },
  }));

  const toolsetBindings = listings.flatMap(({ toolset, tools }) =>
    tools.map((tool): McpToolBinding => ({ kind: McpToolKind.Toolset, runTool: toolset.runTool, tool })),
  );

  const bindings = [...executorBindings, ...toolsetBindings];

  return bindings.filter((binding, index) => bindings.findIndex((other) => other.tool.name === binding.tool.name) === index);
};
