import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { CorrelationOpenSource } from '../../types/CorrelationOpenSource';
import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionCorrelationOpenedData = {
  correlationId: string;
  source: CorrelationOpenSource;
};

export type AdminSessionCorrelationOpenedEffect = Effect<
  AdminSessionEffect.CorrelationOpened,
  EventDocEventPayload<AdminSessionCorrelationOpenedData>
>;
