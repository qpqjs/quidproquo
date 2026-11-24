import type { EventDocAiChatRow } from '../../models';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';

/** The row marked as holding its content in storage. A kind with no content that can be big is returned as it is. */
export const withEventDocAiChatRowStored = (row: EventDocAiChatRow): EventDocAiChatRow =>
  'data' in row ? { ...row, data: { type: EventDocAiChatRowDataType.StorageDrive } } : row;
