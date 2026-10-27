import { askDateNow, askNewGuid } from 'quidproquo-core';

import { askEventDocResolveActor } from '../../../eventDoc';
import { createServiceRequester } from '../../../webSocketQueue/logic/service';
import { askEventDocAiChatUpsert } from '../../data/askEventDocAiChatUpsert';
import { eventDocAiServiceRequest } from '../../logic/eventDocAiServiceRequest';
import type { EventDocAiChatCreatePayload, EventDocAiChatSummary } from '../../models';
import { askEventDocAiContextRead } from '../../module';

// Placeholder requester: serviceRequest only stores its method for
// defineServiceRequests-style map building, which defineEventDocAi bypasses
// (it keys the queue processors directly). The generics still type the handler.
const askChatCreateRequest = createServiceRequester<EventDocAiChatCreatePayload, EventDocAiChatSummary>('eventDocAi', 'ChatCreate');

export const onChatCreate = eventDocAiServiceRequest(askChatCreateRequest, function* askOnChatCreate(payload) {
  const actor = yield* askEventDocResolveActor();
  const { docId } = yield* askEventDocAiContextRead();

  const chatId = yield* askNewGuid();
  const now = yield* askDateNow();

  const chat: EventDocAiChatSummary = {
    docId,
    chatId,
    name: payload.name ?? 'New chat',
    createdAt: now,
    updatedAt: now,
    createdByUserId: actor.userId,
  };

  yield* askEventDocAiChatUpsert(chat);

  return chat;
});
