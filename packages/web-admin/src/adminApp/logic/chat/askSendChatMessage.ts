import { AskResponse } from '@qpqjs/core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionChatMessageSentData } from '../../effects/session/AdminSessionChatMessageSentEffect';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';

// Records that the user asked the log chat something, audit trail only. The
// message itself, the AI's reply, and their storage are the EventDocAi log
// chat's concern now (see LogViewer/LogChat), not this session fold.
export function* askSendChatMessage(correlationId: string, message: string): AskResponse<void> {
  if (!message.trim()) {
    return;
  }

  yield* askApplySessionEvent<AdminSessionChatMessageSentData>(AdminSessionEffect.ChatMessageSent, { correlationId, message });
}
