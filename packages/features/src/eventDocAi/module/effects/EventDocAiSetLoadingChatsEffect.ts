import type { Effect } from 'quidproquo-core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetLoadingChatsPayload = {
  isLoading: boolean;
};

export type EventDocAiSetLoadingChatsEffect = Effect<EventDocAiEffect.SetLoadingChats, SetLoadingChatsPayload>;
