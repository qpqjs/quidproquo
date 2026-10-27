import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import { MCP_REMOTE_PREFIX_GLOBAL } from '../constants/mcpRemotePrefixGlobal';
import { MCP_REMOTE_SERVICE_GLOBAL } from '../constants/mcpRemoteServiceGlobal';
import { McpRemoteTarget } from '../models/McpRemoteTarget';

/** The service and prefix of the remote toolset whose inline function is running (its own runtime globals). */
export function* askMcpRemoteTargetRead(): AskResponse<McpRemoteTarget> {
  const service = yield* askConfigGetGlobal<string>(MCP_REMOTE_SERVICE_GLOBAL);
  const prefix = yield* askConfigGetGlobal<string>(MCP_REMOTE_PREFIX_GLOBAL);

  return { service, prefix };
}
