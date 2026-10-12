/** How the server runs a listed tool. */
export enum McpToolKind {
  // A defineMcpServer tool: the server runs its executor directly.
  Executor = 'executor',
  // Listed by a toolset: the server hands it to that toolset's runTool.
  Toolset = 'toolset',
}
