import type { AiToolDefinition } from '@qpqjs/core';

import { EVENT_DOC_AI_CHAT_NAME_MAX_LENGTH } from '../../constants/eventDocAiChatNameMaxLength';
import { eventDocAiSetChatNameFunctionName } from '../../constants/eventDocAiSetChatNameFunctionName';
import { EVENT_DOC_AI_SET_CHAT_NAME_TOOL_NAME } from '../../constants/eventDocAiSetChatNameToolName';

/** The tool every chat of a collection is given so the model can name the chat. */
export const buildEventDocAiSetChatNameTool = (storeName: string): AiToolDefinition => ({
  name: EVENT_DOC_AI_SET_CHAT_NAME_TOOL_NAME,
  description: `Sets the short name of this chat, shown in the person's list of chats. At most ${EVENT_DOC_AI_CHAT_NAME_MAX_LENGTH} characters.`,
  executor: eventDocAiSetChatNameFunctionName(storeName),
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The new name: a few plain words, like a document title.' },
    },
    required: ['name'],
  },
});
