import { Effect } from 'quidproquo-core';

import { SessionLogEffect } from './SessionLogEffect';

export type SessionLogFlushFailedPayload = {
  errorText: string;
};

export type SessionLogFlushFailedEffect = Effect<SessionLogEffect.flushFailed, SessionLogFlushFailedPayload>;
