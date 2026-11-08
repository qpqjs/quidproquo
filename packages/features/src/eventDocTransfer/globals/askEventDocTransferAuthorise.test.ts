import { ConfigActionType, ErrorTypeEnum, InlineFunctionActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askEventDocStoreProvide, buildEventDocStore } from '../../eventDoc/context';
import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';
import { askEventDocTransferAuthorise } from './askEventDocTransferAuthorise';

const store = buildEventDocStore({ storeName: 'templates', type: 'template' });

const authorise = (action: EventDocPermissionAction, mocks: Record<string, unknown>) =>
  runStory(askEventDocStoreProvide(store, askEventDocTransferAuthorise(action)), mocks);

describe('askEventDocTransferAuthorise', () => {
  it('runs the declared authoriser with the collection and action', () => {
    const calls: unknown[] = [];

    authorise(EventDocPermissionAction.delete, {
      [ConfigActionType.GetGlobal]: 'docs-authorise',
      [InlineFunctionActionType.Execute]: (action: { payload: unknown }) => {
        calls.push(action.payload);
        return undefined;
      },
    });

    expect(calls).toEqual([{ functionName: 'docs-authorise', payload: { storeName: 'templates', action: 'delete' } }]);
  });

  it('skips the check when the transfer declared no authoriser', () => {
    const calls: unknown[] = [];

    authorise(EventDocPermissionAction.write, {
      [ConfigActionType.GetGlobal]: '',
      [InlineFunctionActionType.Execute]: (action: { payload: unknown }) => {
        calls.push(action.payload);
        return undefined;
      },
    });

    expect(calls).toEqual([]);
  });

  // Security regression: the globals builder always sets the authoriser global, so a failed read means the route is
  // misconfigured. The check must fail closed, never fall through to "no authoriser declared".
  it('fails closed when the authoriser global cannot be read', () => {
    expect(() =>
      authorise(EventDocPermissionAction.create, {
        [ConfigActionType.GetGlobal]: throwsError(ErrorTypeEnum.NotFound, 'global missing'),
      }),
    ).toThrow(/global missing/);
  });
});
