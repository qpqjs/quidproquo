import {
  Action,
  ConfigActionType,
  DateActionType,
  EventActionType,
  FileActionType,
  KeyValueStoreActionType,
  LogActionType,
  LogLevelEnum,
  QpqRuntimeType,
  runStory,
  throwsError,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import {
  askErrorReadingStoryResultToMetadata,
  askGetLogInfosFromStoryResult,
  askUpdateDatabaseFromLogFile,
  askUpdateDatabaseFromLogFiles,
  getDecodedAccessTokenFromGetStorySessionActionInStoryResult,
  getDecodedAccessTokenFromSetAccessTokenActionInStoryResult,
  storyResultToMetadata,
} from './askUpdateDatabaseFromLogFiles';

const baseStoryResult = {
  correlation: 'mod::abc',
  moduleName: 'mod',
  runtimeType: QpqRuntimeType.UI,
  startedAt: '2026-06-26T00:00:00.000Z',
  finishedAt: '2026-06-26T00:00:01.000Z',
  tags: [],
  history: [],
} as any;

describe('getDecodedAccessTokenFromSetAccessTokenActionInStoryResult', () => {
  it('returns the decoded token from a SetAccessToken action', () => {
    const decoded = { username: 'joe' };
    const storyResult = { history: [{ act: { type: UserDirectoryActionType.SetAccessToken }, res: decoded }] } as any;

    expect(getDecodedAccessTokenFromSetAccessTokenActionInStoryResult(storyResult)).toBe(decoded);
  });

  it('returns undefined when no SetAccessToken action is present', () => {
    expect(getDecodedAccessTokenFromSetAccessTokenActionInStoryResult({ history: [] } as any)).toBeUndefined();
  });
});

describe('getDecodedAccessTokenFromGetStorySessionActionInStoryResult', () => {
  it('returns the decoded token from the session a GetStorySession action produced', () => {
    const decoded = { username: 'qpqjs/quidproquo#1' };
    const storyResult = { history: [{ act: { type: EventActionType.GetStorySession }, res: { decodedAccessToken: decoded } }] } as any;

    expect(getDecodedAccessTokenFromGetStorySessionActionInStoryResult(storyResult)).toBe(decoded);
  });

  it('returns undefined when the action produced no session', () => {
    const storyResult = { history: [{ act: { type: EventActionType.GetStorySession }, res: undefined }] } as any;

    expect(getDecodedAccessTokenFromGetStorySessionActionInStoryResult(storyResult)).toBeUndefined();
  });

  it('returns undefined when no GetStorySession action is present', () => {
    expect(getDecodedAccessTokenFromGetStorySessionActionInStoryResult({ history: [] } as any)).toBeUndefined();
  });
});

describe('storyResultToMetadata', () => {
  it('derives execution time and joins tags into the generic field', () => {
    const metadata = storyResultToMetadata({ ...baseStoryResult, tags: ['alpha', 'beta'] });

    expect(metadata.executionTimeMs).toBe(1000);
    expect(metadata.generic).toBe('alpha, beta');
    expect(metadata.correlation).toBe('mod::abc');
  });

  it('reads the username from the session decoded access token', () => {
    const metadata = storyResultToMetadata({ ...baseStoryResult, session: { decodedAccessToken: { username: 'joe' } } });

    expect(metadata.userInfo).toBe('joe');
  });

  it('falls back to the identity a route auth decode put on the GetStorySession result', () => {
    const history = [{ act: { type: EventActionType.GetStorySession }, res: { decodedAccessToken: { username: 'qpqjs/quidproquo#1' } } }];
    const metadata = storyResultToMetadata({ ...baseStoryResult, runtimeType: QpqRuntimeType.API, history });

    expect(metadata.userInfo).toBe('qpqjs/quidproquo#1');
  });

  it('records the error and clears the ttl when the story failed', () => {
    const metadata = storyResultToMetadata({ ...baseStoryResult, error: { errorText: 'kaboom' } }, 99);

    expect(metadata.error).toBe('kaboom');
    expect(metadata.ttl).toBeUndefined();
  });
});

describe('askErrorReadingStoryResultToMetadata', () => {
  it('builds error metadata stamped with the current time', () => {
    const now = '2026-06-26T00:00:00.000Z';
    const metadata = runStory(askErrorReadingStoryResultToMetadata('mod::abc'), {
      [DateActionType.Now]: now,
    });

    expect(metadata).toEqual({
      correlation: 'mod::abc',
      moduleName: 'mod',
      runtimeType: QpqRuntimeType.EXECUTE_STORY,
      startedAt: now,
      generic: 'Error loading story result',
      executionTimeMs: 0,
      error: 'Error loading story result',
    });
  });
});

describe('askGetLogInfosFromStoryResult', () => {
  it('maps create and template-literal log actions to log infos', () => {
    const result = {
      history: [
        { act: { type: LogActionType.Create, payload: { logLevel: LogLevelEnum.Error, msg: 'boom' } }, startedAt: 't1' },
        { act: { type: LogActionType.TemplateLiteral, payload: { messageParts: [['a ', ' b'], ['x']] } }, startedAt: 't2' },
      ],
    } as any;

    expect(runStory(askGetLogInfosFromStoryResult(result))).toEqual([
      { logLevel: LogLevelEnum.Error, msg: 'boom', startedAt: 't1' },
      { logLevel: LogLevelEnum.Info, msg: 'a x b', startedAt: 't2' },
    ]);
  });
});

describe('askUpdateDatabaseFromLogFile', () => {
  it('upserts the metadata for a readable log without notifying admins', () => {
    let upserted: any;

    runStory(askUpdateDatabaseFromLogFile('drive', 'mod::abc.json'), {
      [FileActionType.ReadObjectJson]: baseStoryResult,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        upserted = action.payload.item;
      },
    });

    expect(upserted.correlation).toBe('mod::abc');
    expect(upserted.error).toBeUndefined();
  });

  it('builds error metadata and notifies admins when the file cannot be read', () => {
    let scanned = false;
    let upserted: any;

    runStory(askUpdateDatabaseFromLogFile('drive', 'mod::abc.json'), {
      [FileActionType.ReadObjectJson]: throwsError('NotFound', 'missing'),
      [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        upserted = action.payload.item;
      },
      [KeyValueStoreActionType.Scan]: () => {
        scanned = true;
        return { items: [], nextPageKey: undefined };
      },
    });

    expect(upserted.error).toBe('Error loading story result');
    expect(scanned).toBe(true);
  });
});

describe('askUpdateDatabaseFromLogFiles', () => {
  it('processes each file path with no ttl when retention is unset', () => {
    const upsertedCorrelations: string[] = [];

    runStory(askUpdateDatabaseFromLogFiles('drive', ['mod::abc.json']), {
      [ConfigActionType.GetGlobal]: undefined,
      [FileActionType.ReadObjectJson]: baseStoryResult,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        upsertedCorrelations.push(action.payload.item.correlation);
        expect(action.payload.item.ttl).toBeUndefined();
      },
    });

    expect(upsertedCorrelations).toEqual(['mod::abc']);
  });
});
