import type { EventDocAiChatMessage } from '../models';

// The on-drive shape of one chat's history JSON.
export type EventDocAiChatHistoryFile = {
  messages: EventDocAiChatMessage[];
};
