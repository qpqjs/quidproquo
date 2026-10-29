import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionCorrelationClosedData = {
  correlationId: string;
};

export type AdminSessionCorrelationClosedEffect = Effect<
  AdminSessionEffect.CorrelationClosed,
  EventDocEventPayload<AdminSessionCorrelationClosedData>
>;
