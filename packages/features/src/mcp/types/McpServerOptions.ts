import { AiToolDefinition, QpqFunctionRuntime } from 'quidproquo-core';

/** Options for defineMcpServer. */
export type McpServerOptions = {
  // The user directory callers authenticate against (Bearer access token), unless `actionProcessors` override it.
  userDirectoryName: string;
  // Shown to the client as the server's name.
  serverName?: string;
  path?: `/${string}`;
  // Tools the server runs directly by executor, like defineAi's. Toolsets add more (defineMcpToolset).
  tools?: AiToolDefinition[];
  // Processor overrides attached to the endpoint, for custom auth: askRouteAuthValidationDecode decides who is calling,
  // askRouteAuthValidationResolveContext sets context such as the tenant's storage scope. They apply to this route only.
  actionProcessors?: QpqFunctionRuntime[];
};
