import { McpJsonRpcErrorCode } from '../constants/McpJsonRpcErrorCode';
import { McpJsonRpcId } from '../models/McpJsonRpcId';
import { McpJsonRpcResponse } from '../models/McpJsonRpcResponse';

/** A JSON-RPC error reply, for protocol failures only. */
export const buildMcpJsonRpcError = (id: McpJsonRpcId, code: McpJsonRpcErrorCode, message: string): McpJsonRpcResponse => ({
  jsonrpc: '2.0',
  id,
  error: { code, message },
});
