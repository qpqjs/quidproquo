import type { EventDocAiAttachment } from './EventDocAiAttachment';

export type EventDocAiChatSendPayload = {
  chatId: string;
  message: string;
  attachments?: EventDocAiAttachment[];
};
