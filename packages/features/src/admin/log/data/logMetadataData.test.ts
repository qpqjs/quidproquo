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
} from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { LogMetadata } from '../entry/domain/LogMetadata';
import {
  askLogMetadataGetAllByFromCorrelation,
  askLogMetadataGetByCorrelation,
  askLogMetadataList,
  askLogMetadataSetChecked,
  askLogMetadataUpsert,
} from './logMetadataData';

const log = { correlation: 'c1' } as LogMetadata;

describe('askLogMetadataUpsert', () => {
  it('upserts the metadata into the logs store', () => {
    let captured: Action<any> | undefined;

    runStory(askLogMetadataUpsert(log), {
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured?.payload.keyValueStoreName).toBe(QPQ_LOGS_STORAGE_DRIVE_NAME);
    expect(captured?.payload.item).toBe(log);
  });
});

describe('askLogMetadataSetChecked', () => {
  it('updates the metadata keyed by correlation and returns the updated model', () => {
    let captured: Action<any> | undefined;
    const updated = { correlation: 'c1', checked: true } as LogMetadata;

    const result = runStory(askLogMetadataSetChecked('c1', true, 'joe'), {
      [KeyValueStoreActionType.Update]: (action: Action<any>) => {
        captured = action;
        return updated;
      },
    });

    expect(captured?.payload.keyValueStoreName).toBe(QPQ_LOGS_STORAGE_DRIVE_NAME);
    expect(result).toBe(updated);
  });
});

describe('askLogMetadataList', () => {
  it('keys on the runtime type and started-at range with no filter when none are supplied', () => {
    let captured: Action<any> | undefined;

    runStory(askLogMetadataList(QpqRuntimeType.API, 'start', 'end', '', '', '', '', false), {
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

    runStory(askLogMetadataList(QpqRuntimeType.API, 'start', 'end', 'err', 'svc', 'info', 'user', true), {
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

describe('askLogMetadataGetByCorrelation', () => {
  it('returns the first matching log', () => {
    const result = runStory(askLogMetadataGetByCorrelation('c1'), {
      [KeyValueStoreActionType.Query]: { items: [log] },
    });

    expect(result).toBe(log);
  });

  it('returns undefined when nothing matches', () => {
    const result = runStory(askLogMetadataGetByCorrelation('c1'), {
      [KeyValueStoreActionType.Query]: { items: [] },
    });

    expect(result).toBeUndefined();
  });
});

describe('askLogMetadataGetAllByFromCorrelation', () => {
  it('returns every item across the paged query', () => {
    const result = runStory(askLogMetadataGetAllByFromCorrelation('parent'), {
      [KeyValueStoreActionType.Query]: { items: [log, log] },
    });

    expect(result).toEqual([log, log]);
  });
});
