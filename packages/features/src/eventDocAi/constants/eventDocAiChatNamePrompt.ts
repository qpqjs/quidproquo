import { EVENT_DOC_AI_SET_CHAT_NAME_TOOL_NAME } from './eventDocAiSetChatNameToolName';

/**
 * Added to the end of every chat's system prompt. It is the same text every turn, so the prompt cache still holds.
 */
export const EVENT_DOC_AI_CHAT_NAME_PROMPT = [
  '## Naming this chat',
  `This conversation has a short name the person sees in their list of chats. Call the \`${EVENT_DOC_AI_SET_CHAT_NAME_TOOL_NAME}\` tool to set it.`,
  '- On the first message, name the chat after what the person is asking for.',
  '- Later, rename it only when the subject of the conversation has clearly changed. Do not rename it for a follow-up on the same subject.',
  '- Use a few plain words, like a document title. No quotation marks and no full stop.',
  '- Do it alongside your other work and do not mention it in your reply.',
].join('\n');
