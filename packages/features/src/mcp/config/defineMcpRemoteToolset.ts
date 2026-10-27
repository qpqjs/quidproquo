import { defineInlineFunction, QPQConfig } from 'quidproquo-core';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { MCP_REMOTE_PREFIX_GLOBAL } from '../constants/mcpRemotePrefixGlobal';
import { MCP_REMOTE_SERVICE_GLOBAL } from '../constants/mcpRemoteServiceGlobal';
import { McpRemoteToolsetOptions } from '../types/McpRemoteToolsetOptions';
import { defineMcpToolset } from './defineMcpToolset';

/**
 * Offers another service's exported toolsets (defineMcpToolsetExport) on this service's MCP server, each tool name
 * prefixed. Calls cross by service function, carrying the caller and context, never the request's credentials.
 */
export const defineMcpRemoteToolset = ({ service, prefix, instructions }: McpRemoteToolsetOptions): QPQConfig => {
  // One pair of inline functions per remote: the shared entries learn which remote they serve from these globals.
  const globals = { [MCP_REMOTE_SERVICE_GLOBAL]: service, [MCP_REMOTE_PREFIX_GLOBAL]: prefix };
  const listTools = `mcpRemoteListTools_${prefix}`;
  const runTool = `mcpRemoteRunTool_${prefix}`;

  return [
    defineMcpToolset({ name: `remote_${prefix}`, listTools, runTool, instructions, prefix }),
    defineInlineFunction(
      { ...getFeatureEntryQpqFunctionRuntime('mcp', 'inlineFunction', 'mcpRemoteListTools::mcpRemoteListTools'), globals },
      { functionName: listTools },
    ),
    defineInlineFunction(
      { ...getFeatureEntryQpqFunctionRuntime('mcp', 'inlineFunction', 'mcpRemoteRunTool::mcpRemoteRunTool'), globals },
      { functionName: runTool },
    ),
  ];
};
