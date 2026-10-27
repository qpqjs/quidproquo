import { Effect } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { foldEventDocBase } from '../fold/foldEventDocBase';
import { EventDocDocument, EventDocEffect, EventDocEvent } from '../models';
import { EventDocEventValidator } from './types/EventDocEventValidator';
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

  it('types each rule to its effect data when declared against the effects union', () => {
    type RenameEffect = Effect<'RENAME', { name: string }>;
    type ScaleEffect = Effect<'SCALE', { factor: number }>;
    type DocEffects = RenameEffect | ScaleEffect;

    const validRename: EventDocEventValidator<EventDocDocument, RenameEffect['payload']> = ({ payload: { data } }) =>
      data.name.trim() ? null : 'Name is required.';

    const validScale: EventDocEventValidator<EventDocDocument, ScaleEffect['payload']> = ({ payload: { data } }) =>
      data.factor > 0 ? null : 'Factor must be positive.';

    const typedValidators: EventDocEventValidators<EventDocDocument, DocEffects> = {
      RENAME: validRename,
      SCALE: validScale,
      // Reserved lifecycle effects stay addressable so a domain entry can relax the guard
      [Publish]: () => null,
    };

    const _unknownKey: EventDocEventValidators<EventDocDocument, DocEffects> = {
      // @ts-expect-error an unknown event type is a compile error, not a silently dead entry
      SCALEE: () => null,
    };

    const _wrongData: EventDocEventValidators<EventDocDocument, DocEffects> = {
      // @ts-expect-error a rule written against another effect's data cannot be registered under this key
      [InitState]: validScale,
    };

    const typedValidate = createEventDocEventValidator(typedValidators);

    expect(typedValidate(ev('RENAME', { name: ' ' }), foldEventDocBase([init()]))).toBe('Name is required.');
    expect(typedValidate(ev('SCALE', { factor: 2 }), foldEventDocBase([init()]))).toBeNull();
  });

  it('with no domain rules, is just the lifecycle guard', () => {
    const guardOnly = createEventDocEventValidator();
    expect(guardOnly(ev('EDIT'), foldEventDocBase([init(), ev(Publish)]))).toBeTruthy();
    expect(guardOnly(ev('EDIT'), foldEventDocBase([init()]))).toBeNull();
  });
});
