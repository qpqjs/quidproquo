import { Nullable } from '@qpqjs/core';

import { ReportQueuedEvent } from './ReportQueuedEvent';

/**
 * The payload of one report bus message: one event type's events from one append, and the scope they were appended under.
 * The scope and type also make up the FIFO group id, which the consumer checks against them.
 */
export type ReportEventsMessage = {
  scope: Nullable<string>;
  type: string;
  events: ReportQueuedEvent[];
};
