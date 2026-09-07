import { describe, expect, it } from 'vitest';

import { foldEventDocBase } from '../fold/foldEventDocBase';
import { EventDocEffect, EventDocEvent } from '../models';
import { EventDocEventValidators } from './types/EventDocEventValidators';
import { createEventDocEventValidator } from './createEventDocEventValidator';

const eventId = (n: number): number => n;

const { InitState, Publish } = EventDocEffect;

let seq = 0;
const ev = (type: string, data: unknown = {}): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: 1,
      clientMessageId: `m${seq}`,
      createdBy: { userId: 'u', userDisplayName: 'U' },
      createdAt: '2026-01-01T00:00:00.000Z',
      eventId: eventId(seq++),
    },
  },
});

const init = () => ev(InitState, { id: 'd1', code: 'C', name: 'N' });

// A collection whose domain rule ALLOWS a specific event even on a published doc — proving a
// domain entry can relax the reserved guard (no collection currently needs this, but the helper
// must support it) — alongside a plain domain edit that carries no override and so inherits the
// reserved lifecycle guard.
const domainValidators: EventDocEventValidators = {
  ROTATE: () => null,
};
const validate = createEventDocEventValidator(domainValidators);

describe('createEventDocEventValidator', () => {
  it('composes the reserved guard: an un-overridden edit is rejected on a published doc', () => {
    expect(validate(ev('EDIT'), foldEventDocBase([init(), ev(Publish)]))).toBeTruthy();
  });

  it('lets a domain entry OVERRIDE (relax) the guard on a published doc', () => {
    expect(validate(ev('ROTATE'), foldEventDocBase([init(), ev(Publish)]))).toBeNull();
  });

  it('allows un-overridden edits on an open draft', () => {
    expect(validate(ev('EDIT'), foldEventDocBase([init()]))).toBeNull();
  });

  it('with no domain rules, is just the lifecycle guard', () => {
    const guardOnly = createEventDocEventValidator();
    expect(guardOnly(ev('EDIT'), foldEventDocBase([init(), ev(Publish)]))).toBeTruthy();
    expect(guardOnly(ev('EDIT'), foldEventDocBase([init()]))).toBeNull();
  });
});
