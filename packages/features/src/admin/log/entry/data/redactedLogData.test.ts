import {
  Action,
  ErrorTypeEnum,
  FileActionType,
  QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  runStory,
  StoryError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEnsureRedactedLog, askGetRedactedByCorrelation } from './redactedLogData';

const rawLog = { correlation: 'abc', history: [] } as any;

describe('askEnsureRedactedLog', () => {
  it('returns the cached path without touching the raw log', () => {
    const touched: string[] = [];

    const result = runStory(askEnsureRedactedLog('abc'), {
      [FileActionType.Exists]: true,
      [FileActionType.IsColdStorage]: () => {
        touched.push('cold');
        return false;
      },
      [FileActionType.ReadObjectJson]: () => {
        touched.push('read');
        return rawLog;
      },
      [FileActionType.WriteObjectJson]: () => {
        touched.push('write');
      },
    });

    expect(result).toBe('abc.redacted.json');
    expect(touched).toEqual([]);
  });

  it('reads, redacts and writes the copy to the reports drive on a miss', () => {
    let read: Action<any> | undefined;
    let write: Action<any> | undefined;

    const result = runStory(askEnsureRedactedLog('abc'), {
      [FileActionType.Exists]: false,
      [FileActionType.IsColdStorage]: false,
      [FileActionType.ReadObjectJson]: (action: Action<any>) => {
        read = action;
        return rawLog;
      },
      [FileActionType.WriteObjectJson]: (action: Action<any>) => {
        write = action;
      },
    });

    expect(result).toBe('abc.redacted.json');
    expect(read?.payload).toMatchObject({ drive: QPQ_LOGS_STORAGE_DRIVE_NAME, filepath: 'abc.json' });
    expect(write?.payload).toMatchObject({ drive: QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, filepath: 'abc.redacted.json' });
    expect(write?.payload.data).toEqual(rawLog);
    expect(write?.payload.data).not.toBe(rawLog);
  });

  it('returns null and writes nothing when the raw log is cold with no cached copy', () => {
    let wrote = false;

    const result = runStory(askEnsureRedactedLog('abc'), {
      [FileActionType.Exists]: false,
      [FileActionType.IsColdStorage]: true,
      [FileActionType.WriteObjectJson]: () => {
        wrote = true;
      },
    });

    expect(result).toBeNull();
    expect(wrote).toBe(false);
  });
});

describe('askGetRedactedByCorrelation', () => {
  it('reads the redacted copy from the reports drive', () => {
    let read: Action<any> | undefined;

    const result = runStory(askGetRedactedByCorrelation('abc'), {
      [FileActionType.Exists]: true,
      [FileActionType.ReadObjectJson]: (action: Action<any>) => {
        read = action;
        return rawLog;
      },
    });

    expect(read?.payload).toMatchObject({ drive: QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, filepath: 'abc.redacted.json' });
    expect(result).toBe(rawLog);
  });

  it('throws Invalid when the log is cold with no cached copy', () => {
    const run = () =>
      runStory(askGetRedactedByCorrelation('abc'), {
        [FileActionType.Exists]: false,
        [FileActionType.IsColdStorage]: true,
      });

    expect(run).toThrow(StoryError);
    try {
      run();
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.Invalid);
    }
  });
});
