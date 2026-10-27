import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type TabChangedData = {
  tab: number;
  tabName: string;
};

export type TabChangedEvent = Effect<AdminSessionEventType.tabChanged, EventDocEventPayload<TabChangedData>>;
