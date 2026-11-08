import { AskResponse } from '@qpqjs/core';

import type { EventDocAppendBase } from './EventDocAppendBase';
import type { EventDocEvent } from './EventDocEvent';

/**
 * What one append lap needs from its caller: how to build the events on the resolved base, the conditional write,
 * which of its errors mean a slot race worth another lap, and the Conflict text once every lap has been lost.
 */
export type EventDocAppendLap<T extends EventDocEvent[]> = {
  // The events to claim from head + 1 on, built again from the advanced base on every lap.
  buildEvents: (base: EventDocAppendBase) => T;
  // The conditional write; its slot race errors are the ones that re-lap.
  askWrite: (modelId: string, events: T) => AskResponse<void>;
  slotRaceErrorTypes: string[];
  // The Conflict text once every lap has been lost.
  contentionText: string;
};
