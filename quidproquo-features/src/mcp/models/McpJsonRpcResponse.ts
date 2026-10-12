import { McpJsonRpcErrorCode } from '../constants/McpJsonRpcErrorCode';
import { McpJsonRpcId } from './McpJsonRpcId';

/** One JSON-RPC reply: a result or an error, never both. */
export type McpJsonRpcResponse =
  { jsonrpc: '2.0'; id: McpJsonRpcId; result: unknown } | { jsonrpc: '2.0'; id: McpJsonRpcId; error: { code: McpJsonRpcErrorCode; message: string } };
