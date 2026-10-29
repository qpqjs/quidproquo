import { Action, DateActionType, FileActionType, KeyValueStoreActionType, QpqRuntimeType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { LogDeepSearchQuery } from '../../entry/domain';
import { askLogGetAll } from './askLogGetAll';

const TIMESTAMP = '2026-06-26T00:00:00.000Z';

const storyResultText = (msg: string): string =>
  JSON.stringify({
    correlation: 'mod::a',
    moduleName: 'mod',
    runtimeType: QpqRuntimeType.API,
    startedAt: TIMESTAMP,
    finishedAt: TIMESTAMP,
    tags: [],
    input: [],
    session: { depth: 0, context: {} },
    history: [{ act: { type: 'Log/Create', payload: { msg } }, res: [undefined, undefined] }],
  });

const query = (deep: string, onlyErrors = false): LogDeepSearchQuery => ({
  runtimeType: QpqRuntimeType.API,
  startIsoDateTime: 'start',
  endIsoDateTime: 'end',
  errorFilter: '',
  serviceFilter: '',
  infoFilter: '',
  userFilter: '',
  deep,
  onlyErrors,
});

describe('askLogGetAll', () => {
  it('returns the page items unfiltered when not searching deep', () => {
    const items = [{ correlation: 'a' }, { correlation: 'b' }];

    const result = runStory(askLogGetAll(query('')), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Query]: { items, nextPageKey: undefined },
    });

    expect(result).toEqual({ items, nextPageKey: undefined });
  });

  it('keeps only logs whose file contents include the deep search term', () => {
    const items = [{ correlation: 'a' }, { correlation: 'b' }];

    const result = runStory(askLogGetAll(query('needle')), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Query]: { items, nextPageKey: undefined },
      [FileActionType.ReadTextContents]: (action: Action<any>) =>
        storyResultText(action.payload.filepath === 'a.json' ? 'has needle here' : 'nothing'),
    });

    expect(result.items).toEqual([{ correlation: 'a' }]);
  });

  // The deep filter is an oracle over the log text: an admin learning whether a guessed substring is in a log
  // must only ever learn it about the redacted log, never about a secret the admin cannot otherwise read.
  it('never matches a deep search term against a value the admin log redaction removes', () => {
    const items = [{ correlation: 'a' }];
    const rawLog = JSON.stringify({ ...JSON.parse(storyResultText('hello')), session: { depth: 0, context: {}, accessToken: 'tok-secret-abc' } });

    const result = runStory(askLogGetAll(query('tok-secret-abc')), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Query]: { items, nextPageKey: undefined },
      [FileActionType.ReadTextContents]: rawLog,
    });

    expect(result.items).toEqual([]);
  });
});
