import { McpJsonRpcId } from '../models/McpJsonRpcId';
import { McpJsonRpcResponse } from '../models/McpJsonRpcResponse';

/** A successful JSON-RPC reply. */
export const buildMcpJsonRpcResult = (id: McpJsonRpcId, result: unknown): McpJsonRpcResponse => ({ jsonrpc: '2.0', id, result });
