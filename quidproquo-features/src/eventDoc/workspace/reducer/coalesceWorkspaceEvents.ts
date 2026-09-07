import { EventDocEvent } from '../../models';
import { CoalesceEventType } from '../types/CoalesceEventType';
import { EventDocWorkspaceCoalesceRules } from '../types/EventDocWorkspaceCoalesceRules';

const dataKey = (event: EventDocEvent, key: string): unknown => (event.payload.data as Record<string, unknown> | undefined)?.[key];

/**
 * Returns the events that survive coalescing `event` in (the caller appends it after). A bare-string rule drops all events
 * of that type; `{ type, key }` drops only those whose data[key] matches; 'all' treats every type as a bare-string rule.
 */
export const coalesceWorkspaceEvents = (events: EventDocEvent[], event: EventDocEvent, rules: EventDocWorkspaceCoalesceRules): EventDocEvent[] => {
  const rule: CoalesceEventType | undefined =
    rules === 'all' ? event.type : rules.find((entry) => (typeof entry === 'string' ? entry : entry.type) === event.type);

  if (!rule) {
    return events;
  }

  if (typeof rule === 'string') {
    return events.filter((existing) => existing.type !== event.type);
  }

  const incoming = dataKey(event, rule.key);
  return events.filter((existing) => existing.type !== event.type || dataKey(existing, rule.key) !== incoming);
};
