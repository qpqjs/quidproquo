import { StateActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { ApiActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import { askEventDocExportUiOpen } from './askEventDocExportUiOpen';

type Dispatched = { type: EventDocExportUiEffect; payload: Record<string, unknown> };

const candidates = [{ id: 'doc-1', code: 'invoice', name: 'Invoice' }];

// The Open updater raises loading and SetError (with any value) resets it, so the fetch must raise loading again
// after the error is cleared, or the dialog shows its candidates list empty with no spinner while they load.
describe('askEventDocExportUiOpen', () => {
  it('clears the error, then raises loading for the candidate fetch and lowers it after', () => {
    const dispatched: Dispatched[] = [];

    runStory(askEventDocExportUiOpen('docs', '/templates'), {
      [StateActionType.Dispatch]: (action: { payload: { action: Dispatched } }) => {
        dispatched.push(action.payload.action);
        return undefined;
      },
      [ApiActionType.Request]: { status: 200, data: { items: candidates, nextPageKey: undefined } },
    });

    expect(dispatched.map((effect) => [effect.type, effect.payload])).toEqual([
      [EventDocExportUiEffect.Open, {}],
      [EventDocExportUiEffect.SetError, { error: null }],
      [EventDocExportUiEffect.SetLoading, { isLoading: true }],
      [EventDocExportUiEffect.SetLoading, { isLoading: false }],
      [EventDocExportUiEffect.SetCandidates, { candidates }],
    ]);
  });
});
