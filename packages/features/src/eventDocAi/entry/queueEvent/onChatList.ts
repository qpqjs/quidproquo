import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiChatList } from '../../data/askEventDocAiChatList';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import type { EventDocAiChatListPayload, EventDocAiChatSummary } from '../../models';
import { askEventDocAiContextRead } from '../../module';

const askChatListRequest = createServiceRequester<EventDocAiChatListPayload, EventDocAiChatSummary[]>('eventDocAi', 'ChatList');

export const onChatList = eventDocAiServiceRequest(askChatListRequest, function* askOnChatList() {
  const { docId } = yield* askEventDocAiContextRead();

  return yield* askEventDocAiChatList(docId);
});
