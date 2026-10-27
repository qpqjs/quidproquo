import type { Effect } from 'quidproquo-core';
import type { Nullable } from 'quidproquo-core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetActiveChatPayload = {
  chatId: Nullable<string>;
};

export type EventDocAiSetActiveChatEffect = Effect<EventDocAiEffect.SetActiveChat, SetActiveChatPayload>;
