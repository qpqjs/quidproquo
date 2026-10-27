import { AskResponse, Nullable } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { askMcpReadConfig } from '../actions/askMcpReadConfig';
import { McpJsonRpcErrorCode } from '../constants/McpJsonRpcErrorCode';
import { McpMethod } from '../constants/McpMethod';
import { McpJsonRpcResponse } from '../models/McpJsonRpcResponse';
import { askMcpToolBindingsBuild } from './askMcpToolBindingsBuild';
import { askMcpToolsCall } from './askMcpToolsCall';
import { buildMcpInitializeResult } from './buildMcpInitializeResult';
import { buildMcpJsonRpcError } from './buildMcpJsonRpcError';
import { buildMcpJsonRpcResult } from './buildMcpJsonRpcResult';
import { isMcpJsonRpcRequest } from './isMcpJsonRpcRequest';

/** Answers one JSON-RPC message posted to the MCP endpoint. Null for a notification, which the route answers with 202 and no body. */
export function* askMcpHandleRequest(body: unknown, event: HTTPEvent): AskResponse<Nullable<McpJsonRpcResponse>> {
  if (!isMcpJsonRpcRequest(body)) {
    return buildMcpJsonRpcError(null, McpJsonRpcErrorCode.InvalidRequest, 'Expected one JSON-RPC 2.0 request.');
  }

  if (body.id === undefined) {
    return null;
  }

  const { id, method, params = {} } = body;
  const config = yield* askMcpReadConfig();

  switch (method) {
    case McpMethod.Initialize:
      return buildMcpJsonRpcResult(id, buildMcpInitializeResult(params.protocolVersion, config));

    case McpMethod.Ping:
      return buildMcpJsonRpcResult(id, {});

    case McpMethod.ToolsList: {
      const bindings = yield* askMcpToolBindingsBuild(config.tools, config.toolsets, event);
      return buildMcpJsonRpcResult(id, { tools: bindings.map(({ tool }) => tool) });
    }

    case McpMethod.ToolsCall:
      return yield* askMcpToolsCall(id, params, config, event);

    default:
      return buildMcpJsonRpcError(id, McpJsonRpcErrorCode.MethodNotFound, `Unknown method: ${method}`);
  }
}
