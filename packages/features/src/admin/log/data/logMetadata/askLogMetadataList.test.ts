import { Action, KeyValueStoreActionType, kvsAnd, kvsBetween, kvsContains, kvsEqual, kvsExists, QpqRuntimeType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { LogSearchQuery } from '../../entry/domain/LogSearchQuery';
import { askLogMetadataList } from './askLogMetadataList';

const baseQuery: LogSearchQuery = {
  runtimeType: QpqRuntimeType.API,
  startIsoDateTime: 'start',
  endIsoDateTime: 'end',
  errorFilter: '',
  serviceFilter: '',
  infoFilter: '',
  userFilter: '',
  onlyErrors: false,
};

describe('askLogMetadataList', () => {
  it('keys on the runtime type and started-at range with no filter when none are supplied', () => {
    let captured: Action<any> | undefined;

    runStory(askLogMetadataList(baseQuery), {
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

    runStory(
      askLogMetadataList({ ...baseQuery, errorFilter: 'err', serviceFilter: 'svc', infoFilter: 'info', userFilter: 'user', onlyErrors: true }),
      {
        [KeyValueStoreActionType.Query]: (action: Action<any>) => {
          captured = action;
          return { items: [] };
        },
      },
    );

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
