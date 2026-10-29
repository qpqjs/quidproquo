import { askDateNow, askNewGuid, AskResponse } from '@qpqjs/core';

import { askEventDocResolveActor } from '../../eventDoc';
import { askEventDocAiRead } from '../context';
import { askEventDocAiChatUpsert } from '../data/askEventDocAiChatUpsert';
import type { EventDocAiChatCreatePayload, EventDocAiChatSummary } from '../models';

// Starts a chat on the document in context for the caller, stamped with a fresh id and clock.
export function* askEventDocAiChatCreate(payload: EventDocAiChatCreatePayload): AskResponse<EventDocAiChatSummary> {
  const actor = yield* askEventDocResolveActor();
  const { docId } = yield* askEventDocAiRead();

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
}
