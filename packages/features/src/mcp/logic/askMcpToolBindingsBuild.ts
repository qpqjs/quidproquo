import { AiToolDefinition, askInlineFunctionExecute, AskResponse } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { McpTool } from '../models/McpTool';
import { McpToolBinding } from '../models/McpToolBinding';
import { McpToolset } from '../models/McpToolset';
import { McpToolsetListing } from '../models/McpToolsetListing';
import { McpToolsetListToolsInput } from '../models/McpToolsetListToolsInput';
import { buildMcpToolBindings } from './buildMcpToolBindings';

function* askListToolset(toolset: McpToolset, event: HTTPEvent): AskResponse<McpToolsetListing> {
  const tools = yield* askInlineFunctionExecute<McpTool[], McpToolsetListToolsInput>(toolset.listTools, { event });

  return { toolset, tools };
}

/** Asks every toolset for its tools, then binds them after `tools`. Runs as the caller, in the context the request's auth resolved. */
export function* askMcpToolBindingsBuild(tools: AiToolDefinition[], toolsets: McpToolset[], event: HTTPEvent): AskResponse<McpToolBinding[]> {
  const listings: McpToolsetListing[] = [];
  for (const toolset of toolsets) {
    listings.push(yield* askListToolset(toolset, event));
  }

  return buildMcpToolBindings(tools, listings);
}
