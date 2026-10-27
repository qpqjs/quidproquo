import { SessionLogDocCreatedEffect } from './SessionLogDocCreatedEffect';
import { SessionLogEventAppendedEffect } from './SessionLogEventAppendedEffect';
import { SessionLogEventSavedEffect } from './SessionLogEventSavedEffect';
import { SessionLogFlushFailedEffect } from './SessionLogFlushFailedEffect';
import { SessionLogFlushStartedEffect } from './SessionLogFlushStartedEffect';

export type SessionLogEffects =
  | SessionLogDocCreatedEffect
  | SessionLogEventAppendedEffect
  | SessionLogFlushStartedEffect
  | SessionLogEventSavedEffect
  | SessionLogFlushFailedEffect;
