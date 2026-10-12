import { McpJsonRpcRequest } from '../models/McpJsonRpcRequest';
import { isMcpObject } from './isMcpObject';

/** Whether a parsed body is a single JSON-RPC 2.0 message with a method. Batches (arrays) are not, as MCP dropped them. */
export const isMcpJsonRpcRequest = (value: unknown): value is McpJsonRpcRequest =>
  isMcpObject(value) &&
  value.jsonrpc === '2.0' &&
  typeof value.method === 'string' &&
  (value.params === undefined || isMcpObject(value.params)) &&
  (value.id === undefined || value.id === null || typeof value.id === 'string' || typeof value.id === 'number');
