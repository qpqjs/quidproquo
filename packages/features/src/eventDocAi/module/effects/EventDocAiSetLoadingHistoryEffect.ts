import type { Effect } from 'quidproquo-core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetLoadingHistoryPayload = {
  isLoading: boolean;
};

export type EventDocAiSetLoadingHistoryEffect = Effect<EventDocAiEffect.SetLoadingHistory, SetLoadingHistoryPayload>;
