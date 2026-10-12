import { McpJsonRpcId } from './McpJsonRpcId';

/** One JSON-RPC message from the client. No `id` means a notification, which gets no reply. */
export type McpJsonRpcRequest = {
  jsonrpc: '2.0';
  id?: McpJsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};
