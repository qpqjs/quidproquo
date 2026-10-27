/** How the eventDoc AI toolset runs one of its tools. */
export enum McpEventDocAiToolKind {
  ListDocs = 'listDocs',
  // An eventDoc AI's own tool: runs inside the named document's AI context.
  Doc = 'doc',
}
