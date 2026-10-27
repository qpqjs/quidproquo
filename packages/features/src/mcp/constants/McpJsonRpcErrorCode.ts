/** The JSON-RPC 2.0 error codes MCP uses for protocol failures. A tool that fails is a normal result with `isError`, not one of these. */
export enum McpJsonRpcErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}
