import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type TabChangedData = {
  tab: number;
  tabName: string;
};

export type TabChangedEvent = Effect<AdminSessionEventType.tabChanged, EventDocEventPayload<TabChangedData>>;
