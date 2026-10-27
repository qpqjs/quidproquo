import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { readMcpStringArg } from '../../mcp/logic/readMcpStringArg';
import { McpToolsetRunToolInput } from '../../mcp/models/McpToolsetRunToolInput';
import { MCP_DOC_ID_ARG } from '../constants/mcpDocIdArg';
import { McpEventDocAiToolKind } from '../models/McpEventDocAiToolKind';
import { askMcpEventDocAiDocToolRun } from './askMcpEventDocAiDocToolRun';
import { askMcpEventDocAiListDocs } from './askMcpEventDocAiListDocs';
import { askMcpEventDocAiOfferedRead } from './askMcpEventDocAiOfferedRead';
import { buildMcpEventDocAiToolBindings } from './buildMcpEventDocAiToolBindings';

/** The toolset's runTool: listDocs, or an AI tool run in its document's context with docId removed from its arguments. */
export function* askMcpEventDocAiRunTool({ name, args, event }: McpToolsetRunToolInput): AskResponse<unknown> {
  const eventDocAis = yield* askMcpEventDocAiOfferedRead();
  const binding = buildMcpEventDocAiToolBindings(eventDocAis).find(({ tool }) => tool.name === name);
  if (!binding) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Unknown tool: ${name}`);
  }

  if (binding.kind === McpEventDocAiToolKind.ListDocs) {
    const type = readMcpStringArg(args, 'type');
    const collections = eventDocAis.filter(({ isCollection }) => isCollection);
    const eventDocAi = type ? collections.find((candidate) => candidate.type === type) : collections[0];
    if (!eventDocAi) {
      return yield* askThrowError(ErrorTypeEnum.BadRequest, `Unknown document type: ${type}`);
    }

    return yield* askMcpEventDocAiListDocs(eventDocAi, event, readMcpStringArg(args, 'nextPageKey') ?? undefined);
  }

  const { [MCP_DOC_ID_ARG]: _docId, ...toolArgs } = args;

  return yield* askMcpEventDocAiDocToolRun(binding.eventDocAi, binding.executor, event, readMcpStringArg(args, MCP_DOC_ID_ARG), toolArgs);
}
