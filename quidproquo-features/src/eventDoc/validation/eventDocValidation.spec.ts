import { QpqIsoDateTime } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EventDocDocument, EventDocEffect, EventDocEvent, EventDocStatus } from '../models';
import { EventDocEventValidator } from './types/EventDocEventValidator';
import { all } from './all';
import { reservedEventDocEventValidators } from './reservedEventDocEventValidators';
import { validateEventDocEvent } from './validateEventDocEvent';

const eventId = (n: number): number => n;

const { InitState, CreateDraft, Publish, SetCode } = EventDocEffect;

const iso = (s: string): QpqIsoDateTime => s as QpqIsoDateTime;

const event = (type: string): EventDocEvent => ({
  type,
  payload: {
    data: {},
    metadata: {
      version: 1,
      clientMessageId: 'cm',
      createdBy: { userId: 'u1', userDisplayName: 'U' },
      createdAt: iso('2026-01-01T00:00:00.000Z'),
      eventId: eventId(0),
    },
  },
});

const state = (status: EventDocStatus): EventDocDocument => ({
  schemaVersion: 1,
  id: 'abc',
  code: 'FOO',
  name: 'Foo',
  documentVersion: 1,
  status,
  createdAt: iso('2026-01-01T00:00:00.000Z'),
  updatedAt: iso('2026-01-01T00:00:00.000Z'),
});

const reason = (type: string, status: EventDocStatus) => validateEventDocEvent(reservedEventDocEventValidators, event(type), state(status));

describe('reserved validators via validateEventDocEvent', () => {
  describe('when draft', () => {
    it('allows edits (set-code/domain) and publish', () => {
      expect(reason(SetCode, EventDocStatus.Draft)).toBeNull();
      expect(reason('SET_HTML', EventDocStatus.Draft)).toBeNull();
      expect(reason(Publish, EventDocStatus.Draft)).toBeNull();
    });

    it('rejects opening a second draft and re-initialising', () => {
      expect(reason(CreateDraft, EventDocStatus.Draft)).toEqual(expect.any(String));
      expect(reason(InitState, EventDocStatus.Draft)).toEqual(expect.any(String));
    });
  });

  describe('when published', () => {
    it('allows only CREATE_DRAFT', () => {
      expect(reason(CreateDraft, EventDocStatus.Published)).toBeNull();
    });

    it('rejects every other event (edits, publish, init)', () => {
      for (const type of [SetCode, Publish, InitState, 'SET_HTML']) {
        expect(reason(type, EventDocStatus.Published)).toEqual(expect.any(String));
      }
    });
  });
});

describe('validateEventDocEvent', () => {
  it('returns null when no validator and no wildcard match', () => {
    expect(validateEventDocEvent({}, event('SET_HTML'), state(EventDocStatus.Published))).toBeNull();
  });
});

describe('all', () => {
  const fail: EventDocEventValidator = () => 'nope';
  const pass: EventDocEventValidator = () => null;

  it('returns the first failure, short-circuiting', () => {
    expect(all(pass, fail, pass)(event('X'), state(EventDocStatus.Draft))).toBe('nope');
  });

  it('returns null when all pass', () => {
    expect(all(pass, pass)(event('X'), state(EventDocStatus.Draft))).toBeNull();
  });
});
