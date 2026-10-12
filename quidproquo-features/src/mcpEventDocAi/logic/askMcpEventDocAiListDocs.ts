import { AskResponse, QpqPagedData } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { eventDocRouteAction } from '../../eventDoc/constants/eventDocRouteAction';
import { askEventDocStoreProvide } from '../../eventDoc/context/askEventDocStoreProvide';
import { askEventDocListPage } from '../../eventDoc/data/askEventDocListPage';
import { McpDocListItem } from '../models/McpDocListItem';
import { McpEventDocAi } from '../models/McpEventDocAi';
import { askMcpEventDocAiAuthorise } from './askMcpEventDocAiAuthorise';

function* askListPage(eventDocAi: McpEventDocAi, event: HTTPEvent, nextPageKey?: string): AskResponse<QpqPagedData<McpDocListItem>> {
  yield* askMcpEventDocAiAuthorise(eventDocAi.store, event, eventDocRouteAction.list);

  const page = yield* askEventDocListPage({ nextPageKey });

  return {
    items: page.items.map(({ id, name, code, updatedAt }) => ({ id, name, code, updatedAt })),
    nextPageKey: page.nextPageKey,
  };
}

/** One page of an eventDoc AI's documents, gated like the collection's own list route. Must run inside the call's storage scope. */
export function* askMcpEventDocAiListDocs(
  eventDocAi: McpEventDocAi,
  event: HTTPEvent,
  nextPageKey?: string,
): AskResponse<QpqPagedData<McpDocListItem>> {
  return yield* askEventDocStoreProvide(eventDocAi.store, askListPage(eventDocAi, event, nextPageKey));
}
