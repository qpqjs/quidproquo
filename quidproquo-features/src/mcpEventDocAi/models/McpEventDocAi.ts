import { AiToolDefinition } from 'quidproquo-core';

import { EventDocStore } from '../../eventDoc/types/EventDocStore';

/** An eventDoc AI as the MCP toolset sees it: the doc context its tools expect, its collection's store and its tools. */
export type McpEventDocAi = {
  aiName: string;
  serviceName: string;
  type: string;
  store: EventDocStore;
  tools: AiToolDefinition[];
};
