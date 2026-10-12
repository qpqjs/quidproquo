import { askCatch, AskResponse } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { McpJsonRpcErrorCode } from '../constants/McpJsonRpcErrorCode';
import { McpConfig } from '../models/McpConfig';
import { McpJsonRpcId } from '../models/McpJsonRpcId';
import { McpJsonRpcResponse } from '../models/McpJsonRpcResponse';
import { askMcpToolBindingsBuild } from './askMcpToolBindingsBuild';
import { askMcpToolRun } from './askMcpToolRun';
import { buildMcpJsonRpcError } from './buildMcpJsonRpcError';
import { buildMcpJsonRpcResult } from './buildMcpJsonRpcResult';
import { buildMcpToolCallResult } from './buildMcpToolCallResult';
import { isMcpObject } from './isMcpObject';

/** Answers `tools/call`. An unknown tool is a protocol error; a tool that throws is a normal result with `isError`. */
export function* askMcpToolsCall(
  id: McpJsonRpcId,
  params: Record<string, unknown>,
  config: McpConfig,
  event: HTTPEvent,
): AskResponse<McpJsonRpcResponse> {
  const bindings = yield* askMcpToolBindingsBuild(config, event);
  const binding = bindings.find(({ tool }) => tool.name === params.name);
  if (!binding) {
    return buildMcpJsonRpcError(id, McpJsonRpcErrorCode.InvalidParams, `Unknown tool: ${String(params.name)}`);
  }

  const args = isMcpObject(params.arguments) ? params.arguments : {};
  const outcome = yield* askCatch(askMcpToolRun(binding, event, args));

  return buildMcpJsonRpcResult(id, buildMcpToolCallResult(outcome));
}
