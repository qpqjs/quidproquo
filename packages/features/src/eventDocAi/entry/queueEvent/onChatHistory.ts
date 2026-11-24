import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiRead } from '../../context';
import { askEventDocAiChatHistoryPage } from '../../logic/askEventDocAiChatHistoryPage';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import type { EventDocAiChatHistoryPayload, EventDocAiChatHistoryResult } from '../../models';

const askChatHistoryRequest = createServiceRequester<EventDocAiChatHistoryPayload, EventDocAiChatHistoryResult>('eventDocAi', 'ChatHistory');

export const onChatHistory = eventDocAiServiceRequest(askChatHistoryRequest, function* askOnChatHistory(payload) {
  const { docId } = yield* askEventDocAiRead();

  return yield* askEventDocAiChatHistoryPage(docId, payload.chatId, payload.before);
});
