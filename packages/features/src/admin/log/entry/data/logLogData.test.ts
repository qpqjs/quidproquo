import {
  Action,
  ErrorTypeEnum,
  KeyValueStoreActionType,
  kvsAnd,
  kvsBetween,
  kvsContains,
  kvsEqual,
  kvsNotExists,
  kvsOr,
  LogLevelEnum,
  runStory,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { LogLog } from '../domain';
import { askGetLogLog, askListLogLogs, askUpsert } from './logLogData';

const storeName = 'qpq-logs-list';

describe('askUpsert', () => {
  it('upserts the log into the list store', () => {
    let captured: Action<any> | undefined;

    runStory(askUpsert({ type: LogLevelEnum.Error } as LogLog), {
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured?.payload.keyValueStoreName).toBe(storeName);
  });
});

describe('askListLogLogs', () => {
  it('keys on the log level and timestamp range with no filter when none are supplied', () => {
    let captured: Action<any> | undefined;

    runStory(askListLogLogs(LogLevelEnum.Error, 'start', 'end', '', ''), {
      [KeyValueStoreActionType.Query]: (action: Action<any>) => {
        captured = action;
        return { items: [] };
      },
    });

    expect(captured?.payload.keyCondition).toEqual(kvsAnd([kvsEqual('type', LogLevelEnum.Error), kvsBetween('timestamp', 'start', 'end')]));
    expect(captured?.payload.options.filter).toBeUndefined();
  });

  it('builds reason and service filters when supplied', () => {
    let captured: Action<any> | undefined;

    runStory(askListLogLogs(LogLevelEnum.Error, 'start', 'end', 'svc', 'boom'), {
      [KeyValueStoreActionType.Query]: (action: Action<any>) => {
        captured = action;
        return { items: [] };
      },
    });

    expect(captured?.payload.options.filter).toEqual(
      kvsAnd([kvsContains('reason', 'boom'), kvsOr([kvsNotExists('module'), kvsContains('module', 'svc')])]),
    );
  });
});

describe('askGetLogLog', () => {
  it('returns the single matching log', () => {
    const log = { type: ErrorTypeEnum.GenericError, timestamp: 't1' } as unknown as LogLog;

    const result = runStory(askGetLogLog(ErrorTypeEnum.GenericError, 't1'), {
      [KeyValueStoreActionType.Query]: { items: [log] },
    });

    expect(result).toBe(log);
  });

  it('returns null when no log matches', () => {
    const result = runStory(askGetLogLog(ErrorTypeEnum.GenericError, 't1'), {
      [KeyValueStoreActionType.Query]: { items: [] },
    });

    expect(result).toBeNull();
  });
});
