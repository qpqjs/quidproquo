import { AskResponse } from 'quidproquo-core';
import { HTTPEventResponse } from 'quidproquo-webserver';

/** GET and DELETE {path}: this server keeps no sessions and pushes nothing, which MCP clients accept as 405. */
export function* mcpMethodNotAllowed(): AskResponse<HTTPEventResponse> {
  return { status: 405, isBase64Encoded: false, headers: { allow: 'POST' } };
}
