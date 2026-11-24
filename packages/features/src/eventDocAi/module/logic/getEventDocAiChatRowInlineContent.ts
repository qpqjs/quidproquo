import type { Nullable } from '@qpqjs/core';

import type { EventDocAiChatRow } from '../../models';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';

/**
 * The content a row holds itself, wrapped so a content of null is told apart from none. Null for a row whose
 * content is in storage, and for a kind that has no content that can be big (a file reference, usage).
 */
export const getEventDocAiChatRowInlineContent = (row: EventDocAiChatRow): Nullable<{ content: unknown }> =>
  'data' in row && row.data.type === EventDocAiChatRowDataType.Inline ? { content: row.data.content } : null;
