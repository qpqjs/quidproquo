/** The JSON-RPC methods this server answers. Anything else is MethodNotFound. */
export enum McpMethod {
  Initialize = 'initialize',
  Ping = 'ping',
  ToolsList = 'tools/list',
  ToolsCall = 'tools/call',
}
