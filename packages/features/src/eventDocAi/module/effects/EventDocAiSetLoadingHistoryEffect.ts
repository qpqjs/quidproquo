import type { Effect } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetLoadingHistoryPayload = {
  isLoading: boolean;
};

export type EventDocAiSetLoadingHistoryEffect = Effect<EventDocAiEffect.SetLoadingHistory, SetLoadingHistoryPayload>;
