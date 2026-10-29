import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionChatMessageSentData } from '../../effects/session/AdminSessionChatMessageSentEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

export const chatMessageSent = (state: AdminSessionState, { data }: EventDocEventPayload<AdminSessionChatMessageSentData>): AdminSessionState => ({
  ...state,
  chatMessageCounts: {
    ...state.chatMessageCounts,
    [data.correlationId]: (state.chatMessageCounts[data.correlationId] ?? 0) + 1,
  },
});
