import { askInlineFunctionExecute, AskResponse, askThrowError, ErrorTypeEnum, Nullable } from '@qpqjs/core';
import { HTTPEvent } from '@qpqjs/webserver';

import { eventDocRouteAction } from '../../eventDoc/constants/eventDocRouteAction';
import { askEventDocStoreProvide } from '../../eventDoc/context/askEventDocStoreProvide';
import { askEventDocGetById } from '../../eventDoc/data/askEventDocGetById';
import { askEventDocAiContextProvide } from '../../eventDocAi/module/qpqContexts/eventDocAiContext';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { askMcpEventDocAiAuthorise } from './askMcpEventDocAiAuthorise';

// Gated like the collection's get route, so a docId is only usable by someone who could open it, and a
// wrong id fails here with a clear message rather than deep inside the tool.
function* askAssertDocReadable(eventDocAi: McpEventDocAi, event: HTTPEvent, docId: string): AskResponse<void> {
  yield* askMcpEventDocAiAuthorise(eventDocAi.store, event, eventDocRouteAction.get);

  const summary = yield* askEventDocGetById(docId);
  if (!summary || summary.deletedAt) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `No ${eventDocAi.type} with id ${docId} here.`);
  }
}

/**
 * Runs an eventDoc AI tool's executor inside the same doc context the chat gives it (serviceName, type, docId), so
 * the tool cannot tell MCP from chat. A collection's docId is checked first, as its get route would; an AI over a store
 * of its own resolves the id in its tools, as in the chat. Without a docId the context's docId is empty. Must run inside
 * the call's storage scope.
 */
export function* askMcpEventDocAiDocToolRun(
  eventDocAi: McpEventDocAi,
  executor: string,
  event: HTTPEvent,
  docId: Nullable<string>,
  args: Record<string, unknown>,
): AskResponse<unknown> {
  if (docId && eventDocAi.isCollection) {
    yield* askEventDocStoreProvide(eventDocAi.store, askAssertDocReadable(eventDocAi, event, docId));
  }

  return yield* askEventDocAiContextProvide(
    { serviceName: eventDocAi.serviceName, type: eventDocAi.type, docId: docId ?? '' },
    askInlineFunctionExecute(executor, args),
  );
}
