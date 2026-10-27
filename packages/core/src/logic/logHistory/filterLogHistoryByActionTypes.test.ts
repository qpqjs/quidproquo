import { describe, expect, it } from 'vitest';

import { SystemActionType } from '../../actions';
import { ActionHistory } from '../../types';
import { filterLogHistoryByActionTypes } from './filterLogHistoryByActionTypes';

const entry = (type: string): ActionHistory<any> => ({
  act: { type },
  res: [undefined],
  startedAt: '2024-01-01T00:00:00.000Z',
  finishedAt: '2024-01-01T00:00:01.000Z',
});

describe('filterLogHistoryByActionTypes', () => {
  it('keeps only entries whose action type is requested', () => {
    const history = [entry('Date/Now'), entry('Guid/New'), entry('Date/Now')];

    const result = filterLogHistoryByActionTypes(history, ['Date/Now']);

    expect(result.map((e) => e.act.type)).toEqual(['Date/Now', 'Date/Now']);
  });

  it('returns everything when no types are given', () => {
    const history = [entry('Date/Now'), entry('Guid/New')];

    expect(filterLogHistoryByActionTypes(history, [])).toHaveLength(2);
  });

  it('flattens batch actions into their nested actions before filtering', () => {
    const batch: ActionHistory<any> = {
      act: { type: SystemActionType.Batch, payload: { actions: [{ type: 'Date/Now' }, { type: 'Guid/New' }] } },
      res: [undefined],
      startedAt: '2024-01-01T00:00:00.000Z',
      finishedAt: '2024-01-01T00:00:01.000Z',
    };

    const result = filterLogHistoryByActionTypes([batch], ['Guid/New']);

    expect(result.map((e) => e.act.type)).toEqual(['Guid/New']);
  });

  it('gives each flattened batch entry only its own result, not the siblings', () => {
    const batch: ActionHistory<any> = {
      act: { type: SystemActionType.Batch, payload: { actions: [{ type: 'Log/Create' }, { type: 'KVS/Query' }] } },
      res: [[undefined, { secret: 'sibling data that must not leak' }]],
      startedAt: '2024-01-01T00:00:00.000Z',
      finishedAt: '2024-01-01T00:00:01.000Z',
    };

    const [logEntry] = filterLogHistoryByActionTypes([batch], ['Log/Create']);

    expect(logEntry.res).toEqual([undefined]);
    expect(JSON.stringify(logEntry)).not.toContain('sibling data');
  });

  it('unwraps an EitherActionResult for nested actions flagged returnErrors', () => {
    const batch: ActionHistory<any> = {
      act: {
        type: SystemActionType.Batch,
        payload: {
          actions: [
            { type: 'A/Ok', returnErrors: true },
            { type: 'B/Broken', returnErrors: true },
          ],
        },
      },
      res: [
        [
          { success: true, result: 'fine' },
          { success: false, error: { errorType: 'NotFound', errorText: 'missing' } },
        ],
      ],
      startedAt: '2024-01-01T00:00:00.000Z',
      finishedAt: '2024-01-01T00:00:01.000Z',
    };

    const [ok, broken] = filterLogHistoryByActionTypes([batch], []);

    expect(ok.res).toEqual(['fine']);
    expect(broken.res).toEqual([undefined, { errorType: 'NotFound', errorText: 'missing', errorStack: undefined }]);
  });

  it('keeps the batch error on every flattened entry when the batch itself failed', () => {
    const error = { errorType: 'GenericError', errorText: 'batch failed' };
    const batch: ActionHistory<any> = {
      act: { type: SystemActionType.Batch, payload: { actions: [{ type: 'Date/Now' }, { type: 'Guid/New' }] } },
      res: [undefined, error],
      startedAt: '2024-01-01T00:00:00.000Z',
      finishedAt: '2024-01-01T00:00:01.000Z',
    };

    const result = filterLogHistoryByActionTypes([batch], []);

    expect(result).toHaveLength(2);
    expect(result[0].res).toEqual([undefined, error]);
    expect(result[1].res).toEqual([undefined, error]);
  });
});
