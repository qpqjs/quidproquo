import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type ConfigServiceSelectedData = {
  service: string;
};

export type ConfigServiceSelectedEvent = Effect<AdminSessionEventType.configServiceSelected, EventDocEventPayload<ConfigServiceSelectedData>>;
