import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiRead } from '../../context';
import { askEventDocAiChatRowContentLink } from '../../logic/askEventDocAiChatRowContentLink';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import type { EventDocAiChatRowContentPayload, EventDocAiChatRowContentResult } from '../../models';

const askChatRowContentRequest = createServiceRequester<EventDocAiChatRowContentPayload, EventDocAiChatRowContentResult>(
  'eventDocAi',
  'ChatRowContent',
);

export const onChatRowContent = eventDocAiServiceRequest(askChatRowContentRequest, function* askOnChatRowContent(payload) {
  const { docId } = yield* askEventDocAiRead();

  return yield* askEventDocAiChatRowContentLink(docId, payload.chatId, payload.sk);
});
