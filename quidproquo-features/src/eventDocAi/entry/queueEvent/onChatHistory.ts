import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiChatHistoryLoad } from '../../data/askEventDocAiChatHistoryLoad';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import type { EventDocAiChatHistoryPayload, EventDocAiChatMessage } from '../../models';
import { askEventDocAiContextRead } from '../../module';

const askChatHistoryRequest = createServiceRequester<EventDocAiChatHistoryPayload, EventDocAiChatMessage[]>('eventDocAi', 'ChatHistory');

export const onChatHistory = eventDocAiServiceRequest(askChatHistoryRequest, function* askOnChatHistory(payload) {
  const { docId } = yield* askEventDocAiContextRead();

  return yield* askEventDocAiChatHistoryLoad(docId, payload.chatId);
});
