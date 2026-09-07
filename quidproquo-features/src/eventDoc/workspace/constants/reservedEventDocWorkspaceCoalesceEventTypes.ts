import { EventDocEffect } from '../../models';
import { CoalesceEventType } from '../types';

/** Reserved field-setter types every document slot coalesces. Lifecycle events (CREATE_DRAFT/PUBLISH) never coalesce. */
export const reservedEventDocWorkspaceCoalesceEventTypes: CoalesceEventType[] = [EventDocEffect.SetCode, EventDocEffect.SetName];
