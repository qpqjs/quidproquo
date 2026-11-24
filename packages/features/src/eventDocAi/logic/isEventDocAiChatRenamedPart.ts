import { type AiStreamPart, AiStreamPartType } from '@qpqjs/core';

import { EVENT_DOC_AI_SET_CHAT_NAME_TOOL_NAME } from '../constants/eventDocAiSetChatNameToolName';

/** Whether this stream part is the setChatName tool answering that it worked. */
export const isEventDocAiChatRenamedPart = (part: AiStreamPart): boolean =>
  part.type === AiStreamPartType.ToolResult &&
  part.toolName === EVENT_DOC_AI_SET_CHAT_NAME_TOOL_NAME &&
  typeof part.output === 'object' &&
  part.output !== null &&
  (part.output as { ok?: unknown }).ok === true;
