import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type LogCheckToggledData = {
  correlationId: string;
  checked: boolean;
};

export type LogCheckToggledEvent = Effect<AdminSessionEventType.logCheckToggled, EventDocEventPayload<LogCheckToggledData>>;
