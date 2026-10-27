import { AskResponse } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { ChatMessageSentData } from '../../effects/session/ChatMessageSentEvent';

// Records that the user asked the log chat something — audit trail only. The
// message itself, the AI's reply, and their storage are the EventDocAi log
// chat's concern now (see LogViewer/LogChat), not this session fold.
export function* askSendChatMessage(correlationId: string, message: string): AskResponse<void> {
  if (!message.trim()) {
    return;
  }

  yield* askApplySessionEvent<ChatMessageSentData>(AdminSessionEventType.chatMessageSent, { correlationId, message });
}
