import { DynamicFunctionsActionType, ErrorTypeEnum, runStory, throwsError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocStoreOptions } from '../context/buildEventDocStore';
import { EventDocEvent, EventDocEventActor } from '../models';
import { askEventDocValidateAppend } from './askEventDocValidateAppend';

// The gate's load-bearing guarantee (#554): an event the fold cannot read never reaches the
// append-only log. The registered validator is one line of defence; the pre-fold of the
// candidate is the one that holds for every collection, hand-rolled or not.

const STORE: EventDocStoreOptions = { storeName: 'test-memos', type: 'memo' };
const ACTOR = { userId: 'user-1' } as EventDocEventActor;

const event = (version: number): EventDocEvent => ({
  type: 'SET_BODY',
  payload: {
    data: { body: 'x' },
    metadata: { version, clientMessageId: 'm-1', createdBy: ACTOR, createdAt: '2026-09-15T00:00:00.000Z', eventId: 1 },
  },
});

type FunctionCall = { functionName: string; args: unknown[] };

// A registered definition that folds versions 1 and 2, and whose fold throws (as
// buildVersionRoutedReducer does) for anything else.
const buildMocks = ({ verdict = null as string | null } = {}) => {
  const calls: string[] = [];

  const mocks = {
    [DynamicFunctionsActionType.Execute]: (action: { payload: FunctionCall }) => {
      const { functionName, args } = action.payload;
      calls.push(functionName);

      if (functionName === 'validateEvent') {
        return verdict;
      }
      if (functionName === 'foldDocumentState') {
        const [events, seed] = args as [EventDocEvent[], { body: string }];
        const { version } = events[0].payload.metadata;
        if (version !== 1 && version !== 2) {
          return throwsError(ErrorTypeEnum.GenericError, `No event-doc fold reducer for schema version ${version} (registered: 1, 2).`);
        }
        return { ...seed, body: 'x' };
      }
      throw new Error(`unexpected dynamic function ${functionName}`);
    },
  };

  return { mocks, calls };
};

const run = (candidate: EventDocEvent, mocks: object, state: unknown = { body: '' }) =>
  runStory(askEventDocProvideStore(STORE, askEventDocValidateAppend(candidate, state)), mocks);

describe('askEventDocValidateAppend', () => {
  it('validates, then folds the candidate and returns the state after it', () => {
    const { mocks, calls } = buildMocks();

    expect(run(event(2), mocks)).toEqual({ body: 'x' });
    expect(calls).toEqual(['validateEvent', 'foldDocumentState']);
  });

  it('throws Invalid on a validator rejection without folding', () => {
    const { mocks, calls } = buildMocks({ verdict: 'document is published' });

    expect(() => run(event(2), mocks)).toThrow(/document is published/);
    expect(calls).toEqual(['validateEvent']);
  });

  it('throws Invalid when the fold cannot read the candidate, so it is never written', () => {
    const { mocks } = buildMocks();

    let caught: unknown;
    try {
      run(event(3), mocks);
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ errorType: ErrorTypeEnum.Invalid });
    expect(String((caught as { errorText: string }).errorText)).toMatch(/No event-doc fold reducer for schema version 3/);
  });
});
