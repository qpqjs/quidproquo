import type { EventDocAiChatRow } from '../../models';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';

/** Whether a row's content is held in storage, not on the row. */
export const isEventDocAiChatRowStored = (row: EventDocAiChatRow): boolean =>
  'data' in row && row.data.type === EventDocAiChatRowDataType.StorageDrive;
