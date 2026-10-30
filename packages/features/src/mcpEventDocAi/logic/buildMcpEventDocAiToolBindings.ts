import { AiToolDefinition, unique } from '@qpqjs/core';

import { buildMcpToolInputSchema } from '../../mcp/logic/buildMcpToolInputSchema';
import { MCP_DOC_ID_ARG } from '../constants/mcpDocIdArg';
import { McpEventDocAiToolName } from '../constants/McpEventDocAiToolName';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { McpEventDocAiToolBinding } from '../models/McpEventDocAiToolBinding';
import { McpEventDocAiToolKind } from '../models/McpEventDocAiToolKind';

type ToolWithExecutor = AiToolDefinition & { executor: string };

// A tool with no executor is answered by the chat's browser client, so there is nothing to run here.
const hasExecutor = (tool: AiToolDefinition): tool is ToolWithExecutor => !!tool.executor;

const buildDocProperty = (eventDocAi: McpEventDocAi): Record<string, unknown> => ({
  [MCP_DOC_ID_ARG]: {
    type: 'string',
    description: eventDocAi.isCollection
      ? `Id of the ${eventDocAi.type} to work on, from ${McpEventDocAiToolName.ListDocs}. Needed by tools that read or change one ${eventDocAi.type}.`
      : `Id of the ${eventDocAi.type} to work on. Needed by tools that read or change one ${eventDocAi.type}.`,
  },
});

const buildListDocsBinding = (eventDocAis: McpEventDocAi[]): McpEventDocAiToolBinding => {
  const types = eventDocAis.map((eventDocAi) => eventDocAi.type);

  return {
    kind: McpEventDocAiToolKind.ListDocs,
    tool: {
      name: McpEventDocAiToolName.ListDocs,
      description: `List ${types.join(' or ')} documents, newest first. Use it to find the id of the one the user means, then pass that id as ${MCP_DOC_ID_ARG}.`,
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: types, description: `Which kind of document. Defaults to ${types[0]}.` },
          nextPageKey: { type: 'string', description: 'From a previous reply, to get the next page.' },
        },
      },
    },
  };
};

// Tool names two of the service's AIs both use. Each AI's copy is then offered under its doc type, so neither is lost.
const findSharedToolNames = (eventDocAis: McpEventDocAi[]): Set<string> => {
  const names = eventDocAis.flatMap((eventDocAi) => unique(eventDocAi.tools.filter(hasExecutor).map(({ name }) => name)));

  return new Set(names.filter((name, index) => names.indexOf(name) !== index));
};

/**
 * listDocs (over the AIs whose store is a collection, when there are any), then every eventDoc AI's tools with a docId
 * argument added. A name more than one AI uses is offered once per AI as `${type}_${name}`; every other name is
 * unchanged. Nothing at all when the service has no eventDoc AI.
 */
export const buildMcpEventDocAiToolBindings = (eventDocAis: McpEventDocAi[]): McpEventDocAiToolBinding[] => {
  if (eventDocAis.length === 0) {
    return [];
  }

  const sharedNames = findSharedToolNames(eventDocAis);

  const docBindings = eventDocAis.flatMap((eventDocAi) =>
    eventDocAi.tools.filter(hasExecutor).map((tool): McpEventDocAiToolBinding => ({
      kind: McpEventDocAiToolKind.Doc,
      executor: tool.executor,
      eventDocAi,
      tool: {
        name: sharedNames.has(tool.name) ? `${eventDocAi.type}_${tool.name}` : tool.name,
        description: tool.description,
        inputSchema: buildMcpToolInputSchema(tool.inputSchema, buildDocProperty(eventDocAi)),
      },
    })),
  );

  const collections = eventDocAis.filter(({ isCollection }) => isCollection);

  return [...(collections.length > 0 ? [buildListDocsBinding(collections)] : []), ...docBindings];
};
