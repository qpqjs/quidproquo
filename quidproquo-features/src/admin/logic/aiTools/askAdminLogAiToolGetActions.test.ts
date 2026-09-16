import { ContextActionType, FileActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { eventDocAiContext } from '../../../eventDocAi';
import { askAdminLogAiToolGetActions } from './askAdminLogAiToolGetActions';

describe('askAdminLogAiToolGetActions', () => {
  it('reads the log for the trusted docId from context, not from any tool input', () => {
    const log = {
      correlation: 'corr-1',
      history: [
        {
          act: { type: 'KeyValueStore/Get', payload: {} },
          res: [{ ok: true }, undefined],
          startedAt: '2026-07-11T00:00:00.000Z',
          finishedAt: '2026-07-11T00:00:00.010Z',
        },
      ],
    };

    let requestedDrivePath: string | undefined;

    const result = runStory(askAdminLogAiToolGetActions(), {
      [ContextActionType.Read]: (action: { payload: { contextIdentifier: { uniqueName: string } } }) =>
        action.payload.contextIdentifier.uniqueName === eventDocAiContext.uniqueName ? { serviceName: 'log', type: 'log', docId: 'corr-1' } : {},
      [FileActionType.Exists]: true,
      [FileActionType.ReadObjectJson]: (action: { payload: { filepath: string } }) => {
        requestedDrivePath = action.payload.filepath;
        return log;
      },
    });

    expect(requestedDrivePath).toBe('corr-1.redacted.json');
    expect(result).toEqual([
      {
        index: 0,
        actionType: 'KeyValueStore/Get',
        startedAt: '2026-07-11T00:00:00.000Z',
        finishedAt: '2026-07-11T00:00:00.010Z',
        executionTimeMs: 10,
        success: true,
        error: undefined,
      },
    ]);
  });
});
