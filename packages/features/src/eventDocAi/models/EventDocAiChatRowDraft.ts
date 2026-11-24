import type { EventDocAiChatRow } from './EventDocAiChatRow';

// Omit applied to each member of the union, so a draft keeps the fields of its own kind.
type OmitFromEach<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A chat row before it has its id and its message's id. */
export type EventDocAiChatRowDraft = OmitFromEach<EventDocAiChatRow, 'sk' | 'messageId'>;
