import type { Effect } from 'quidproquo-core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetSendingPayload = {
  isSending: boolean;
};

export type EventDocAiSetSendingEffect = Effect<EventDocAiEffect.SetSending, SetSendingPayload>;
