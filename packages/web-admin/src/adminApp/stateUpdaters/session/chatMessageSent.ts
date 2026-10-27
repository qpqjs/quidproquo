import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { ChatMessageSentData } from '../../effects/session/ChatMessageSentEvent';

export const chatMessageSent = (state: AdminSessionState, { data }: EventDocEventPayload<ChatMessageSentData>): AdminSessionState => ({
  ...state,
  chatMessageCounts: {
    ...state.chatMessageCounts,
    [data.correlationId]: (state.chatMessageCounts[data.correlationId] ?? 0) + 1,
  },
});
