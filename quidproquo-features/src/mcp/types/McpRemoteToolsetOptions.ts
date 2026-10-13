/** Options for defineMcpRemoteToolset. */
export type McpRemoteToolsetOptions = {
  // The service that calls defineMcpToolsetExport.
  service: string;
  // Put in front of each of its tool names, so two services cannot clash. Letters, digits and dashes.
  prefix: string;
  // Added to the server's `instructions` on initialize.
  instructions?: string;
};
