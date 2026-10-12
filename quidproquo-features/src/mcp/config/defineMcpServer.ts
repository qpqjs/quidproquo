import { defineActionProcessors, QPQConfig, QpqFunctionRuntimeAdvanced } from 'quidproquo-core';
import { defineRoute } from 'quidproquo-webserver';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { McpServerOptions } from '../types/McpServerOptions';
import { defineMcpServerSetting } from './defineMcpServerSetting';

/**
 * An MCP server (streamable HTTP, stateless) at `path` offering `options.tools` plus every defineMcpToolset in the service.
 * Tools are listed per request, so a tool added to a toolset's source is offered on the next deploy. Every call runs as the authenticated
 * user: a user-directory login by default, or whoever `actionProcessors` overrides decide.
 */
export const defineMcpServer = (options: McpServerOptions): QPQConfig => {
  const path = options.path ?? '/mcp';
  const methodNotAllowed = getFeatureEntryQpqFunctionRuntime('mcp', 'route', 'mcpMethodNotAllowed::mcpMethodNotAllowed');

  const postRuntime: QpqFunctionRuntimeAdvanced = {
    ...getFeatureEntryQpqFunctionRuntime('mcp', 'route', 'mcpPost::mcpPost'),
    ...(options.actionProcessors ? { actionProcessors: options.actionProcessors } : {}),
  };

  return [
    defineMcpServerSetting(options),
    defineActionProcessors(getFeatureEntryQpqFunctionRuntime('mcp', 'actionProcessor', 'getMcpReadConfig::getMcpReadConfig')),
    defineRoute('POST', path, postRuntime, { routeAuthSettings: { userDirectoryName: options.userDirectoryName } }),
    defineRoute('GET', path, methodNotAllowed),
    defineRoute('DELETE', path, methodNotAllowed),
  ];
};
