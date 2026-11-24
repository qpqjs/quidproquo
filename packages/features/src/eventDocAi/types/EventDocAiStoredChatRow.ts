import type { EventDocAiChatRow } from '../models';

/** A chat row as the rows store holds it: pk = docId#chatId, so a chat can only be read through its own document. */
export type EventDocAiStoredChatRow = EventDocAiChatRow & { pk: string };
