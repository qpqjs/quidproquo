import {
  Action,
  ActionHistory,
  DateActionType,
  KeyValueStoreActionType,
  KvsQueryCondition,
  NetworkActionType,
  runStory,
  StoryResult,
  SystemActionType,
} from 'quidproquo-core';
import { EmailActionType, EmailDeliveryStatus } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { QPQ_LOG_ACTIONS_KVS_NAME } from '../constants/qpqLogActionsKvsName';
import { QPQ_LOG_ENTITIES_KVS_NAME } from '../constants/qpqLogEntitiesKvsName';
import { QPQ_LOG_ENTITY_LOOKUP_KVS_NAME } from '../constants/qpqLogEntityLookupKvsName';
import { ActionSearchActionRow } from '../domain/ActionSearchActionRow';
import { askUpdateActionSearchFromStoryResult } from './askUpdateActionSearchFromStoryResult';

const networkEntry: ActionHistory = {
  act: {
    type: NetworkActionType.Request,
    payload: { url: '/users', method: 'GET', basePath: 'https://api.example.com', responseType: 'json' },
  },
  res: [{ data: {}, status: 200, statusText: 'OK', headers: {} }],
  startedAt: '2026-07-24T00:00:01.000Z',
  finishedAt: '2026-07-24T00:00:01.250Z',
};

const emailEntry: ActionHistory = {
  act: {
    type: EmailActionType.SendEmail,
    payload: { from: 'noreply@x.com', to: ['joe@x.com'], cc: ['ops@x.com'], subject: 'Welcome', bodyText: 'hi' },
  },
  res: ['msg-123'],
  startedAt: '2026-07-24T00:00:02.000Z',
  finishedAt: '2026-07-24T00:00:02.100Z',
};

const unindexedEntry: ActionHistory = {
  act: { type: DateActionType.Now },
  res: ['2026-07-24T00:00:03.000Z'],
  startedAt: '2026-07-24T00:00:03.000Z',
  finishedAt: '2026-07-24T00:00:03.001Z',
};

const buildStoryResult = (history: ActionHistory[]): StoryResult<any> =>
  ({
    correlation: 'corr-1',
    moduleName: 'test-service',
    history,
    startedAt: '2026-07-24T00:00:00.000Z',
    finishedAt: '2026-07-24T00:00:05.000Z',
  }) as unknown as StoryResult<any>;

type UpsertAction = Action<{ keyValueStoreName: string; item: Record<string, unknown> }>;
type QueryAction = Action<{ keyValueStoreName: string; keyCondition: KvsQueryCondition }>;

// The only query the ingestion story issues is the linkKey refold lookup
const buildMocks = (storedLinkKeyRows: ActionSearchActionRow[] = []) => {
  const upserts: Record<string, Record<string, unknown>[]> = {};

  const onUpsert = (action: UpsertAction) => {
    const { keyValueStoreName, item } = action.payload!;
    (upserts[keyValueStoreName] ??= []).push(item);
    return undefined;
  };

  const onQuery = (action: QueryAction) => {
    const linkKey = action.payload!.keyCondition.valueA;
    return { items: storedLinkKeyRows.filter((row) => row.linkKey === linkKey) };
  };

  const mocks = {
    [KeyValueStoreActionType.Upsert]: onUpsert,
    [KeyValueStoreActionType.Query]: onQuery,
  };

  return { mocks, upserts };
};

describe('askUpdateActionSearchFromStoryResult', () => {
  it('writes rows only for registered action types', () => {
    const { mocks, upserts } = buildMocks();

    runStory(askUpdateActionSearchFromStoryResult(buildStoryResult([networkEntry, emailEntry, unindexedEntry])), mocks);

    expect(upserts[QPQ_LOG_ACTIONS_KVS_NAME]).toHaveLength(2);

    const [networkRow, emailRow] = upserts[QPQ_LOG_ACTIONS_KVS_NAME];

    expect(networkRow).toMatchObject({
      correlation: 'corr-1',
      actionIndex: 0,
      actionType: NetworkActionType.Request,
      startedAt: '2026-07-24T00:00:01.000Z',
      moduleName: 'test-service',
      executionTimeMs: 250,
      url: 'https://api.example.com/users',
      method: 'GET',
      status: 200,
    });
    expect(networkRow.linkKey).toBeUndefined();

    expect(emailRow).toMatchObject({
      actionIndex: 1,
      actionType: EmailActionType.SendEmail,
      linkKey: 'email#msg-123',
      deliveryStatus: EmailDeliveryStatus.sent,
    });
  });

  it('folds the entity from the batch rows and writes prefixed lookup rows', () => {
    const { mocks, upserts } = buildMocks();

    runStory(askUpdateActionSearchFromStoryResult(buildStoryResult([emailEntry]), 12345), mocks);

    expect(upserts[QPQ_LOG_ENTITIES_KVS_NAME]).toHaveLength(1);
    expect(upserts[QPQ_LOG_ENTITIES_KVS_NAME][0]).toMatchObject({
      linkKey: 'email#msg-123',
      entityType: 'email',
      createdAt: '2026-07-24T00:00:02.000Z',
      subject: 'Welcome',
      deliveryStatus: EmailDeliveryStatus.sent,
      sentAt: '2026-07-24T00:00:02.000Z',
      ttl: 12345,
    });

    const lookupKeys = (upserts[QPQ_LOG_ENTITY_LOOKUP_KVS_NAME] ?? []).map((row) => row.lookupKey);
    expect(lookupKeys).toEqual(['email#recipient#joe@x.com', 'email#recipient#ops@x.com']);
    expect(upserts[QPQ_LOG_ENTITY_LOOKUP_KVS_NAME][0]).toMatchObject({
      sortValue: '2026-07-24T00:00:02.000Z#email#msg-123',
      linkKey: 'email#msg-123',
      ttl: 12345,
    });
  });

  it('refolds against stored rows so out-of-order arrivals converge', () => {
    // A Failed row from an earlier story is already stored under the same linkKey
    const storedFailedRow: ActionSearchActionRow = {
      correlation: 'corr-0',
      actionIndex: 4,
      actionType: EmailActionType.SendEmail,
      startedAt: '2026-07-24T00:00:00.500Z',
      moduleName: 'test-service',
      executionTimeMs: 50,
      deliveryStatus: EmailDeliveryStatus.dropped,
      subject: 'Welcome',
      linkKey: 'email#msg-123',
    };

    const { mocks, upserts } = buildMocks([storedFailedRow]);

    runStory(askUpdateActionSearchFromStoryResult(buildStoryResult([emailEntry])), mocks);

    expect(upserts[QPQ_LOG_ENTITIES_KVS_NAME][0]).toMatchObject({
      deliveryStatus: EmailDeliveryStatus.dropped,
      createdAt: '2026-07-24T00:00:00.500Z',
      sentAt: '2026-07-24T00:00:00.500Z',
    });
  });

  it('dedupes the stored and batch copies of the same row', () => {
    const { mocks, upserts } = buildMocks();

    // First ingestion primes nothing; re-run with the stored copy visible in the query
    runStory(askUpdateActionSearchFromStoryResult(buildStoryResult([emailEntry])), mocks);
    const firstEntity = upserts[QPQ_LOG_ENTITIES_KVS_NAME][0];

    const storedCopy = upserts[QPQ_LOG_ACTIONS_KVS_NAME][0] as ActionSearchActionRow;
    const { mocks: rerunMocks, upserts: rerunUpserts } = buildMocks([storedCopy]);

    runStory(askUpdateActionSearchFromStoryResult(buildStoryResult([emailEntry])), rerunMocks);

    expect(rerunUpserts[QPQ_LOG_ENTITIES_KVS_NAME]).toHaveLength(1);
    expect(rerunUpserts[QPQ_LOG_ENTITIES_KVS_NAME][0]).toEqual(firstEntity);
  });

  it('extracts actions nested inside batches, including nested batches', () => {
    // Batch of [network request, batch of [email send]]; the batch result is one
    // array with a raw value per nested action, nested arrays for nested batches
    const batchEntry: ActionHistory = {
      act: {
        type: SystemActionType.Batch,
        payload: {
          actions: [
            { type: NetworkActionType.Request, payload: { url: '/users', method: 'GET', basePath: 'https://api.example.com', responseType: 'json' } },
            {
              type: SystemActionType.Batch,
              payload: {
                actions: [{ type: EmailActionType.SendEmail, payload: { from: 'noreply@x.com', to: ['joe@x.com'], subject: 'Hi', bodyText: 'hi' } }],
              },
            },
          ],
        },
      },
      res: [[{ data: {}, status: 404, statusText: 'Not Found', headers: {} }, ['msg-456']]],
      startedAt: '2026-07-24T00:00:04.000Z',
      finishedAt: '2026-07-24T00:00:04.500Z',
    };

    const { mocks, upserts } = buildMocks();

    runStory(askUpdateActionSearchFromStoryResult(buildStoryResult([batchEntry])), mocks);

    expect(upserts[QPQ_LOG_ACTIONS_KVS_NAME]).toHaveLength(2);

    const [networkRow, emailRow] = upserts[QPQ_LOG_ACTIONS_KVS_NAME];

    expect(networkRow).toMatchObject({ actionIndex: 0, actionType: NetworkActionType.Request, status: 404 });
    expect(emailRow).toMatchObject({ actionIndex: 1, actionType: EmailActionType.SendEmail, linkKey: 'email#msg-456' });
  });

  it('does nothing for a story with no registered actions', () => {
    const { mocks, upserts } = buildMocks();

    runStory(askUpdateActionSearchFromStoryResult(buildStoryResult([unindexedEntry])), mocks);

    expect(upserts).toEqual({});
  });
});
