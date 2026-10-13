import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askServiceFunctionExecute } from 'quidproquo-webserver';

import { MCP_EXPORT_RUN_TOOL_FN } from '../constants/mcpExportRunToolFn';
import { McpToolsetRunToolInput } from '../models/McpToolsetRunToolInput';
import { askMcpRemoteTargetRead } from './askMcpRemoteTargetRead';
import { buildMcpForwardedEvent } from './buildMcpForwardedEvent';
import { parseMcpRemoteToolName } from './parseMcpRemoteToolName';

/** A remote toolset's runTool: the call, under the exporting service's own tool name, run in that service as this caller. */
export function* askMcpRemoteRunTool({ name, args, event }: McpToolsetRunToolInput): AskResponse<unknown> {
  const { service, prefix } = yield* askMcpRemoteTargetRead();

  const remoteName = parseMcpRemoteToolName(prefix, name);
  if (!remoteName) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Unknown tool: ${name}`);
  }

  return yield* askServiceFunctionExecute<unknown, McpToolsetRunToolInput>(service, MCP_EXPORT_RUN_TOOL_FN, {
    name: remoteName,
    args,
    event: buildMcpForwardedEvent(event),
  });
}
