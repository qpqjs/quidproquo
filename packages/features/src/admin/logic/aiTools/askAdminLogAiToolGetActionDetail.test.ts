import { ContextActionType, FileActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocAiContext } from '../../../eventDocAi';
import { askAdminLogAiToolGetActionDetail } from './askAdminLogAiToolGetActionDetail';

describe('askAdminLogAiToolGetActionDetail', () => {
  it('uses the trusted docId from context together with the model-supplied index', () => {
    const log = {
      correlation: 'corr-1',
      history: [
        {
          act: { type: 'KeyValueStore/Get', payload: { id: 'x' } },
          res: [{ id: 'x', found: true }, undefined],
          startedAt: '2026-07-11T00:00:00.000Z',
          finishedAt: '2026-07-11T00:00:00.010Z',
        },
      ],
    };

    let requestedDrivePath: string | undefined;

    const result = runStory(askAdminLogAiToolGetActionDetail({ index: 0 }), {
      [ContextActionType.Read]: (action: { payload: { contextIdentifier: { uniqueName: string } } }) =>
        action.payload.contextIdentifier.uniqueName === eventDocAiContext.uniqueName ? { serviceName: 'log', type: 'log', docId: 'corr-1' } : {},
      [FileActionType.Exists]: true,
      [FileActionType.ReadObjectJson]: (action: { payload: { filepath: string } }) => {
        requestedDrivePath = action.payload.filepath;
        return log;
      },
    });

    expect(requestedDrivePath).toBe('corr-1.redacted.json');
    expect(result).toEqual({
      index: 0,
      actionType: 'KeyValueStore/Get',
      input: { id: 'x' },
      output: { id: 'x', found: true },
      error: undefined,
      startedAt: '2026-07-11T00:00:00.000Z',
      finishedAt: '2026-07-11T00:00:00.010Z',
    });
  });
});
