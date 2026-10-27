import type { Effect } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetSendingPayload = {
  isSending: boolean;
};

export type EventDocAiSetSendingEffect = Effect<EventDocAiEffect.SetSending, SetSendingPayload>;
