import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type ConfigServiceSelectedData = {
  service: string;
};

export type ConfigServiceSelectedEvent = Effect<AdminSessionEventType.configServiceSelected, EventDocEventPayload<ConfigServiceSelectedData>>;
