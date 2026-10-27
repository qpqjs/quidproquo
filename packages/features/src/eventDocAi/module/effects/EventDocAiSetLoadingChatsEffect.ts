import type { Effect } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetLoadingChatsPayload = {
  isLoading: boolean;
};

export type EventDocAiSetLoadingChatsEffect = Effect<EventDocAiEffect.SetLoadingChats, SetLoadingChatsPayload>;
