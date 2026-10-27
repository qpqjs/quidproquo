import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiProcessSend } from '../../logic/askEventDocAiProcessSend';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import type { EventDocAiChatSendPayload, EventDocAiChatSendResult } from '../../models';
import { askEventDocAiContextRead } from '../../module';

const askChatSendRequest = createServiceRequester<EventDocAiChatSendPayload, EventDocAiChatSendResult>('eventDocAi', 'ChatSend');

export const onChatSend = eventDocAiServiceRequest(askChatSendRequest, function* askOnChatSend(payload) {
  const { docId } = yield* askEventDocAiContextRead();

  return yield* askEventDocAiProcessSend(docId, payload.chatId, payload.message, payload.attachments);
});
