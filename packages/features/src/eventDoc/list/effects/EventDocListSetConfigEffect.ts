import { Effect } from 'quidproquo-core';

import { EventDocListConfig } from '../types/EventDocListConfig';
import { EventDocListEffect } from './EventDocListEffect';

/** Payload of SetConfig. */
export type EventDocListSetConfigPayload = EventDocListConfig;

/** Stores the host-supplied config. */
export type EventDocListSetConfigEffect = Effect<EventDocListEffect.SetConfig, EventDocListSetConfigPayload>;
