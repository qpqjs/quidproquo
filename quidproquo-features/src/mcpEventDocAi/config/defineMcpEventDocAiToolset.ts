import { defineActionProcessors, defineInlineFunction, QPQConfig } from 'quidproquo-core';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { defineMcpToolset } from '../../mcp/config/defineMcpToolset';
import { MCP_DOC_ID_ARG } from '../constants/mcpDocIdArg';
import { MCP_EVENT_DOC_AI_EXCLUDED_TOOLS_GLOBAL } from '../constants/mcpEventDocAiExcludedToolsGlobal';
import { MCP_EVENT_DOC_AI_LIST_TOOLS_FN } from '../constants/mcpEventDocAiListToolsFn';
import { MCP_EVENT_DOC_AI_RUN_TOOL_FN } from '../constants/mcpEventDocAiRunToolFn';
import { McpEventDocAiToolName } from '../constants/McpEventDocAiToolName';
import { MCP_EVENT_DOC_AI_TOOLSET_NAME } from '../constants/mcpEventDocAiToolsetName';
import { McpEventDocAiToolsetOptions } from '../types/McpEventDocAiToolsetOptions';

/**
 * Offers every eventDoc AI's tools in this service on its MCP server, plus listDocs. Each AI tool takes a docId and
 * runs in that document's AI context, as it would in the chat.
 */
export const defineMcpEventDocAiToolset = ({ userDirectoryName, excludeTools = [] }: McpEventDocAiToolsetOptions): QPQConfig => {
  // Collection hooks (e.g. the tenant authoriser) resolve the caller through the eventDoc user-directory global, which
  // eventDoc routes set per route. An inline function's own globals reach everything it calls, so these carry it.
  const globals = { [EVENT_DOC_USER_DIRECTORY_GLOBAL]: userDirectoryName, [MCP_EVENT_DOC_AI_EXCLUDED_TOOLS_GLOBAL]: excludeTools };

  return [
    defineMcpToolset({
      name: MCP_EVENT_DOC_AI_TOOLSET_NAME,
      listTools: MCP_EVENT_DOC_AI_LIST_TOOLS_FN,
      runTool: MCP_EVENT_DOC_AI_RUN_TOOL_FN,
      instructions: `Tools that work on one document need its id as ${MCP_DOC_ID_ARG}. Find it with ${McpEventDocAiToolName.ListDocs} from the name the user gives, and ask if more than one matches.`,
    }),
    defineActionProcessors(
      getFeatureEntryQpqFunctionRuntime('mcpEventDocAi', 'actionProcessor', 'getMcpEventDocAiReadConfig::getMcpEventDocAiReadConfig'),
    ),
    defineInlineFunction(
      { ...getFeatureEntryQpqFunctionRuntime('mcpEventDocAi', 'inlineFunction', 'mcpEventDocAiListTools::mcpEventDocAiListTools'), globals },
      { functionName: MCP_EVENT_DOC_AI_LIST_TOOLS_FN },
    ),
    defineInlineFunction(
      { ...getFeatureEntryQpqFunctionRuntime('mcpEventDocAi', 'inlineFunction', 'mcpEventDocAiRunTool::mcpEventDocAiRunTool'), globals },
      { functionName: MCP_EVENT_DOC_AI_RUN_TOOL_FN },
    ),
  ];
};
