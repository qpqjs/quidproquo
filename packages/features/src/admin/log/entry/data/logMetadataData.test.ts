import {
  Action,
  KeyValueStoreActionType,
  kvsAnd,
  kvsBetween,
  kvsContains,
  kvsEqual,
  kvsExists,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  QpqRuntimeType,
  runStory,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { LogMetadata } from '../domain/LogMetadata';
import { askGetAllByFromCorrelation, askGetByCorrelation, askListLogs, askSetChecked, askUpsert } from './logMetadataData';

const log = { correlation: 'c1' } as LogMetadata;

describe('askUpsert', () => {
  it('upserts the metadata into the logs store', () => {
    let captured: Action<any> | undefined;

    runStory(askUpsert(log), {
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured?.payload.keyValueStoreName).toBe(QPQ_LOGS_STORAGE_DRIVE_NAME);
    expect(captured?.payload.item).toBe(log);
  });
});

describe('askSetChecked', () => {
  it('updates the metadata keyed by correlation and returns the updated model', () => {
    let captured: Action<any> | undefined;
    const updated = { correlation: 'c1', checked: true } as LogMetadata;

    const result = runStory(askSetChecked('c1', true, 'joe'), {
      [KeyValueStoreActionType.Update]: (action: Action<any>) => {
        captured = action;
        return updated;
      },
    });

    expect(captured?.payload.keyValueStoreName).toBe(QPQ_LOGS_STORAGE_DRIVE_NAME);
    expect(result).toBe(updated);
  });
});

describe('askListLogs', () => {
  it('keys on the runtime type and started-at range with no filter when none are supplied', () => {
    let captured: Action<any> | undefined;

    runStory(askListLogs(QpqRuntimeType.API, 'start', 'end', '', '', '', '', false), {
      [KeyValueStoreActionType.Query]: (action: Action<any>) => {
        captured = action;
        return { items: [] };
      },
    });

    expect(captured?.payload.keyCondition).toEqual(kvsAnd([kvsEqual('runtimeType', QpqRuntimeType.API), kvsBetween('startedAt', 'start', 'end')]));
    expect(captured?.payload.options.filter).toBeUndefined();
  });

  it('builds the error, service, info and user filters when supplied', () => {
    let captured: Action<any> | undefined;

    runStory(askListLogs(QpqRuntimeType.API, 'start', 'end', 'err', 'svc', 'info', 'user', true), {
      [KeyValueStoreActionType.Query]: (action: Action<any>) => {
        captured = action;
        return { items: [] };
      },
    });

    expect(captured?.payload.options.filter).toEqual(
      kvsAnd([
        kvsExists('error'),
        kvsEqual('moduleName', 'svc'),
        kvsContains('generic', 'info'),
        kvsContains('error', 'err'),
        kvsContains('userInfo', 'user'),
      ]),
    );
  });
});

describe('askGetByCorrelation', () => {
  it('returns the first matching log', () => {
    const result = runStory(askGetByCorrelation('c1'), {
      [KeyValueStoreActionType.Query]: { items: [log] },
    });

    expect(result).toBe(log);
  });

  it('returns undefined when nothing matches', () => {
    const result = runStory(askGetByCorrelation('c1'), {
      [KeyValueStoreActionType.Query]: { items: [] },
    });

    expect(result).toBeUndefined();
  });
});

describe('askGetAllByFromCorrelation', () => {
  it('returns every item across the paged query', () => {
    const result = runStory(askGetAllByFromCorrelation('parent'), {
      [KeyValueStoreActionType.Query]: { items: [log, log] },
    });

    expect(result).toEqual([log, log]);
  });
});
