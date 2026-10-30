import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiRead } from '../../context';
import { askEventDocAiChatList } from '../../data/askEventDocAiChatList';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import type { EventDocAiChatListPayload, EventDocAiChatSummary } from '../../models';

const askChatListRequest = createServiceRequester<EventDocAiChatListPayload, EventDocAiChatSummary[]>('eventDocAi', 'ChatList');

export const onChatList = eventDocAiServiceRequest(askChatListRequest, function* askOnChatList() {
  const { docId } = yield* askEventDocAiRead();

  return yield* askEventDocAiChatList(docId);
});
