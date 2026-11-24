import type { EventDocAiChatRow } from './EventDocAiChatRow';

/**
 * One page of a chat's rows, oldest first. A chat is never sent whole: it grows without limit and a websocket
 * message does not. `hasMore` says older rows remain; ask for them with the first row's id as `before`.
 */
export type EventDocAiChatHistoryResult = {
  rows: EventDocAiChatRow[];
  hasMore: boolean;
};
