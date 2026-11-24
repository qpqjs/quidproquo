import type { EventDocAiChatMessage, EventDocAiChatRow } from '../../models';
import { eventDocAiMessageToChatRowDrafts } from './eventDocAiMessageToChatRowDrafts';

/**
 * Rows for a message the browser made itself (a question just sent, a reply just streamed), to sit after
 * `existingRowCount` rows. They have no row id, since the server has not sent one, and a message id that
 * cannot match a server row or another local message.
 */
export const toEventDocAiLocalChatRows = (message: EventDocAiChatMessage, existingRowCount: number): EventDocAiChatRow[] =>
  eventDocAiMessageToChatRowDrafts(message).map((draft) => ({ ...draft, sk: '', messageId: `local-${existingRowCount}` }) as EventDocAiChatRow);
