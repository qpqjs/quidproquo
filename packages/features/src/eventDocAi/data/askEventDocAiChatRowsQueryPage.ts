import { askConfigGetGlobal, askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual, kvsLessThan, kvsNotEqual, QpqPagedData } from '@qpqjs/core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_PAGE_MAX_ROWS } from '../constants/eventDocAiChatPageMaxRows';
import { EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatRow } from '../models';
import { EventDocAiChatRowKind } from '../models/EventDocAiChatRowKind';
import type { EventDocAiStoredChatRow } from '../types/EventDocAiStoredChatRow';
import { eventDocAiChatRowsPk } from './eventDocAiChatRowsPk';
import { toEventDocAiChatRow } from './toEventDocAiChatRow';

/** Options for askEventDocAiChatRowsQueryPage. */
export type EventDocAiChatRowsQueryPageOptions = {
  // Only rows older than this row id; absent reads from the newest.
  before?: string;
  // False leaves usage rows out at the store, so they are never read into a page a browser is sent.
  includeUsage: boolean;
};

/** One page of a chat's rows, NEWEST first, as the store returns them. `nextPageKey` is set while older rows remain. */
export function* askEventDocAiChatRowsQueryPage(
  docId: string,
  chatId: string,
  { before, includeUsage }: EventDocAiChatRowsQueryPageOptions,
): AskResponse<QpqPagedData<EventDocAiChatRow>> {
  const store = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL);
  const scope = yield* askEventDocResolveScope();
  const pk = kvsEqual('pk', eventDocAiChatRowsPk(docId, chatId));

  const page = yield* askKeyValueStoreQuery<EventDocAiStoredChatRow>(store, before === undefined ? pk : kvsAnd([pk, kvsLessThan('sk', before)]), {
    scope,
    sortAscending: false,
    limit: EVENT_DOC_AI_CHAT_PAGE_MAX_ROWS,
    // A chat is reloaded straight after a send, so the page must see the rows that send just wrote.
    consistentRead: true,
    ...(includeUsage ? {} : { filter: kvsNotEqual('kind', EventDocAiChatRowKind.Usage) }),
  });

  return { ...page, items: page.items.map(toEventDocAiChatRow) };
}
