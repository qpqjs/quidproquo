import { EVENT_DOC_AI_CHAT_NAME_MAX_LENGTH } from '../constants/eventDocAiChatNameMaxLength';

/**
 * A chat name as it is stored: one line of plain text, trimmed and cut to the longest a name may be. The name is
 * written by the model, which reads document content, so nothing about it is trusted. Empty when nothing usable
 * is left.
 */
export const normaliseEventDocAiChatName = (name: unknown): string =>
  typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, EVENT_DOC_AI_CHAT_NAME_MAX_LENGTH).trim() : '';
