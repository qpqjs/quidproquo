import { describe, expect, it } from 'vitest';

import { readReportEventsMessage } from './readReportEventsMessage';

const payload = { scope: 'TENANT#t1', type: 'documentRendered', events: [{ any: 'thing' }] };

describe('readReportEventsMessage', () => {
  it('reads a payload whose FIFO group is the one its scope and type name', () => {
    expect(readReportEventsMessage(payload, 'TENANT#t1/documentRendered')).toEqual({ message: payload });
    expect(readReportEventsMessage({ ...payload, scope: null }, 'unscoped/documentRendered')).toEqual({ message: { ...payload, scope: null } });
  });

  // Security regression: the group is the lane, so a payload naming another tenant's scope in this lane is refused.
  it('refuses a payload whose scope or type disagrees with its group, or that has no group', () => {
    expect(readReportEventsMessage(payload, 'TENANT#t2/documentRendered')).toEqual({ problem: expect.stringContaining('message group') });
    expect(readReportEventsMessage(payload, 'TENANT#t1/packBuilt')).toEqual({ problem: expect.stringContaining('message group') });
    expect(readReportEventsMessage(payload, undefined)).toEqual({ problem: expect.stringContaining('message group') });
  });

  it('refuses a payload that is not a report events message', () => {
    expect(readReportEventsMessage('nope', 'x')).toEqual({ problem: 'the payload is not an object' });
    expect(readReportEventsMessage({ ...payload, scope: '' }, 'x')).toEqual({ problem: 'scope must be a scope or null' });
    expect(readReportEventsMessage({ ...payload, type: 'bad/type' }, 'x')).toEqual({ problem: 'type is not an event type' });
    expect(readReportEventsMessage({ ...payload, events: {} }, 'x')).toEqual({ problem: 'events must be a list' });
    expect(readReportEventsMessage({ ...payload, extra: 1 }, 'x')).toEqual({ problem: expect.stringContaining("unknown key 'extra'") });
  });
});
