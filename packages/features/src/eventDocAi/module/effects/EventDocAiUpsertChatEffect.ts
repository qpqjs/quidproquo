import type { Effect } from 'quidproquo-core';

import type { EventDocAiChatSummary } from '../../models';
import { EventDocAiEffect } from './EventDocAiEffect';

export type UpsertChatPayload = {
  chat: EventDocAiChatSummary;
};

export type EventDocAiUpsertChatEffect = Effect<EventDocAiEffect.UpsertChat, UpsertChatPayload>;
