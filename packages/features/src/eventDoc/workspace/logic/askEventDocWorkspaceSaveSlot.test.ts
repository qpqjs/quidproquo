import { Action, AskResponse, ErrorTypeEnum, StateActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EventDocEvent, EventDocEventInput } from '../../models';
import { EventDocWorkspaceEffect } from '../effects/EventDocWorkspaceEffect';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceSaveSlot } from './askEventDocWorkspaceSaveSlot';
import { createInitialEventDocWorkspaceState } from './createInitialEventDocWorkspaceState';

const pendingEvent: EventDocEvent = {
  type: 'NOTE_ADD',
  payload: {
    data: {},
    metadata: {
      version: 1,
      clientMessageId: 'c1',
      eventId: -1,
      createdAt: '2026-10-29T00:00:00.000Z',
      createdBy: { userId: 'u', userDisplayName: 'u' },
    },
  },
};

const buildState = () => {
  const state = createInitialEventDocWorkspaceState({});
  return {
    ...state,
    slots: { noteA: { documentIdentity: { collection: 'notes', docId: 'a' }, isLoading: false, isSaving: false, error: null } },
    pending: { noteA: [pendingEvent] },
    history: { noteA: [] },
    bases: { noteA: null },
  };
};

const transport: EventDocWorkspaceTransport = {
  *askFetchBootstrap(): AskResponse<never> {
    throw new Error('not used');
  },
  *askFetchEvents(): AskResponse<never> {
    throw new Error('not used');
  },
  *askFetchEventsPage(): AskResponse<never> {
    throw new Error('not used');
  },
  *askAppendEvent(_identity, input: EventDocEventInput): AskResponse<EventDocEvent> {
    return { ...pendingEvent, type: input.type };
  },
};

describe('askEventDocWorkspaceSaveSlot', () => {
  it('clears the saving flag when the save throws part-way through', () => {
    const dispatched: Array<{ type: string; payload: any }> = [];
    let stateReads = 0;

    const run = () =>
      runStory(askEventDocWorkspaceSaveSlot(transport, {}, 'noteA'), {
        [StateActionType.Read]: () => {
          stateReads += 1;
          // The first read starts the save; the next one, inside the batch, fails like a broken resync would.
          return stateReads > 1 ? throwsError(ErrorTypeEnum.GenericError, 'rebase exploded') : buildState();
        },
        [StateActionType.Dispatch]: (action: Action<any>) => {
          dispatched.push(action.payload.action);
        },
      });

    expect(run).not.toThrow();

    const savingFlags = dispatched.filter((effect) => effect.type === EventDocWorkspaceEffect.SetSaving).map((effect) => effect.payload.isSaving);
    expect(savingFlags).toEqual([true, false]);

    const errors = dispatched.filter((effect) => effect.type === EventDocWorkspaceEffect.SetError);
    expect(errors).toHaveLength(1);
    expect(errors![0]!.payload.error.operation).toBe('save');
  });
});
