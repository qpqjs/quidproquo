import { AskResponse, QpqPagedData } from '@qpqjs/core';
import { HTTPEvent } from '@qpqjs/webserver';

import { eventDocRouteAction } from '../../eventDoc/constants/eventDocRouteAction';
import { askEventDocStoreProvide } from '../../eventDoc/context/askEventDocStoreProvide';
import { askEventDocListPage } from '../../eventDoc/data/askEventDocListPage';
import { askEventDocAuthorise } from '../../eventDoc/logic/askEventDocAuthorise';
import { McpDocListItem } from '../models/McpDocListItem';
import { McpEventDocAi } from '../models/McpEventDocAi';

function* askListPage(eventDocAi: McpEventDocAi, event: HTTPEvent, nextPageKey?: string): AskResponse<QpqPagedData<McpDocListItem>> {
  yield* askEventDocAuthorise(eventDocAi.store, eventDocRouteAction.list, event);

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
