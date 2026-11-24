import type { EventDocAiChatRowDataType } from './EventDocAiChatRowDataType';

/**
 * The content of a chat row: on the row itself, or in a file on the chat blobs drive when it is too big for a
 * row. The file's path is worked out from the row's key, so the row carries no pointer.
 */
export type EventDocAiChatRowData<TContent> =
  { type: EventDocAiChatRowDataType.Inline; content: TContent } | { type: EventDocAiChatRowDataType.StorageDrive };
