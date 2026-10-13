/** Options for defineMcpEventDocAiToolset. */
export type McpEventDocAiToolsetOptions = {
  // The user directory the collections' hooks (e.g. the tenant authoriser) resolve the caller against.
  userDirectoryName: string;
  // AI tool names not to offer, such as tools another toolset on the same server already offers. Neither listed nor runnable.
  excludeTools?: string[];
};
