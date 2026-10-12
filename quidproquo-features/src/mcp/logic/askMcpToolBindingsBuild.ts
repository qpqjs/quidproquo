import { askInlineFunctionExecute, AskResponse } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { McpConfig } from '../models/McpConfig';
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

/** Asks every toolset for its tools, then binds them with the server's own. Runs as the caller, in the context the route's auth resolved. */
export function* askMcpToolBindingsBuild(config: McpConfig, event: HTTPEvent): AskResponse<McpToolBinding[]> {
  const listings: McpToolsetListing[] = [];
  for (const toolset of config.toolsets) {
    listings.push(yield* askListToolset(toolset, event));
  }

  return buildMcpToolBindings(config, listings);
}
