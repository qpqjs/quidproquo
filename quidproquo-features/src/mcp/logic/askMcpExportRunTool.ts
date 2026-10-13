import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askMcpReadToolsets } from '../actions/askMcpReadToolsets';
import { McpToolsetRunToolInput } from '../models/McpToolsetRunToolInput';
import { askMcpToolBindingsBuild } from './askMcpToolBindingsBuild';
import { askMcpToolRun } from './askMcpToolRun';

/** Runs one tool of the toolsets this service exports, through its toolset's runTool, as the calling service's caller. */
export function* askMcpExportRunTool({ name, args, event }: McpToolsetRunToolInput): AskResponse<unknown> {
  const toolsets = yield* askMcpReadToolsets();
  const bindings = yield* askMcpToolBindingsBuild([], toolsets, event);

  const binding = bindings.find(({ tool }) => tool.name === name);
  if (!binding) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Unknown tool: ${name}`);
  }

  return yield* askMcpToolRun(binding, event, args);
}
