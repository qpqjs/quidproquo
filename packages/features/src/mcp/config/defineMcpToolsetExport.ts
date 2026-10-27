import { defineActionProcessors, QPQConfig } from 'quidproquo-core';
import { defineServiceFunction } from 'quidproquo-webserver';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { MCP_EXPORT_LIST_TOOLS_FN } from '../constants/mcpExportListToolsFn';
import { MCP_EXPORT_RUN_TOOL_FN } from '../constants/mcpExportRunToolFn';

/**
 * Offers this service's toolsets (its defineMcpToolset registrations) to an MCP server in another service, which adds
 * them with defineMcpRemoteToolset. Two backend-only service functions: list the tools, run one. They run as the
 * calling service's caller and context, so auth happens once, at the MCP endpoint.
 */
export const defineMcpToolsetExport = (): QPQConfig => [
  defineActionProcessors(getFeatureEntryQpqFunctionRuntime('mcp', 'actionProcessor', 'getMcpReadToolsets::getMcpReadToolsets')),
  defineServiceFunction(getFeatureEntryQpqFunctionRuntime('mcp', 'serviceFunction', 'mcpExportListTools::mcpExportListTools'), {
    functionName: MCP_EXPORT_LIST_TOOLS_FN,
  }),
  defineServiceFunction(getFeatureEntryQpqFunctionRuntime('mcp', 'serviceFunction', 'mcpExportRunTool::mcpExportRunTool'), {
    functionName: MCP_EXPORT_RUN_TOOL_FN,
  }),
];
