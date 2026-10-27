import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { CorrelationOpenSource } from '../../types/CorrelationOpenSource';
import { AdminSessionEventType } from './AdminSessionEventType';

export type CorrelationOpenedData = {
  correlationId: string;
  source: CorrelationOpenSource;
};

export type CorrelationOpenedEvent = Effect<AdminSessionEventType.correlationOpened, EventDocEventPayload<CorrelationOpenedData>>;
