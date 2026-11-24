import type { EventDocAiChatRow } from '../models';
import type { EventDocAiStoredChatRow } from '../types/EventDocAiStoredChatRow';

/** A stored row without its partition key, as logic and the browser use it. */
export const toEventDocAiChatRow = ({ pk: _pk, ...row }: EventDocAiStoredChatRow): EventDocAiChatRow => row;
