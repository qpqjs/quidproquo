import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { SessionEndReason } from '../../types/SessionEndReason';
import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionEndedData = {
  reason: SessionEndReason;
};

export type AdminSessionEndedEffect = Effect<AdminSessionEffect.SessionEnded, EventDocEventPayload<AdminSessionEndedData>>;
