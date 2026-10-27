import { AiToolDefinition } from '@qpqjs/core';

import { EventDocStore } from '../../eventDoc/types/EventDocStore';

/** An eventDoc AI as the MCP toolset sees it: the doc context its tools expect, its collection's store and its tools. */
export type McpEventDocAi = {
  aiName: string;
  serviceName: string;
  type: string;
  store: EventDocStore;
  tools: AiToolDefinition[];
  // Whether the AI's store is an eventDoc collection mounted with defineEventDocRoutes. False for an AI that only borrows
  // the chat machinery over a store of its own: listDocs leaves it out and its docId goes to its tools unchecked.
  isCollection: boolean;
};
