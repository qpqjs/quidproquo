import { askCatch, AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { McpJsonRpcErrorCode } from '../../constants/McpJsonRpcErrorCode';
import { askMcpHandleRequest } from '../../logic/askMcpHandleRequest';
import { buildMcpJsonRpcError } from '../../logic/buildMcpJsonRpcError';

/** POST {path}: the MCP endpoint (streamable HTTP transport, stateless, JSON replies only). */
export function* mcpPost(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const body = yield* askCatch(qpqWebServerUtils.askFromJsonEventRequest<unknown>(event));
  if (!body.success) {
    return qpqWebServerUtils.toJsonEventResponse(buildMcpJsonRpcError(null, McpJsonRpcErrorCode.ParseError, body.error.errorText));
  }

  const response = yield* askCatch(askMcpHandleRequest(body.result, event));
  if (!response.success) {
    return qpqWebServerUtils.toJsonEventResponse(buildMcpJsonRpcError(null, McpJsonRpcErrorCode.InternalError, response.error.errorText));
  }

  if (!response.result) {
    return { status: 202, isBase64Encoded: false };
  }

  return qpqWebServerUtils.toJsonEventResponse(response.result);
}
