import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiChatHistoryLoad } from '../../data/askEventDocAiChatHistoryLoad';
import { askEventDocAiUsageVisible } from '../../logic/askEventDocAiUsageVisible';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import { redactEventDocAiChatMessageUsage } from '../../logic/redactEventDocAiChatMessageUsage';
import type { EventDocAiChatHistoryPayload, EventDocAiChatMessage } from '../../models';
import { askEventDocAiContextRead } from '../../module';

const askChatHistoryRequest = createServiceRequester<EventDocAiChatHistoryPayload, EventDocAiChatMessage[]>('eventDocAi', 'ChatHistory');

export const onChatHistory = eventDocAiServiceRequest(askChatHistoryRequest, function* askOnChatHistory(payload) {
  const { docId } = yield* askEventDocAiContextRead();

  const messages = yield* askEventDocAiChatHistoryLoad(docId, payload.chatId);
  const usageVisible = yield* askEventDocAiUsageVisible();

  return usageVisible ? messages : messages.map(redactEventDocAiChatMessageUsage);
});
