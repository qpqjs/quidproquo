import {
  Action,
  ErrorTypeEnum,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsQueryCondition,
  KvsQueryOperation,
  NetworkActionType,
  runStory,
} from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';
import { EmailActionType, EmailDeliveryStatus } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { QPQ_LOG_ACTIONS_KVS_NAME } from '../../constants/qpqLogActionsKvsName';
import { QPQ_LOG_ENTITIES_KVS_NAME } from '../../constants/qpqLogEntitiesKvsName';
import { QPQ_LOG_ENTITY_LOOKUP_KVS_NAME } from '../../constants/qpqLogEntityLookupKvsName';
import { ActionSearchFilterOperator } from '../../domain/ActionSearchFilterOperator';
import { getEntityTimeline, listActionRows, listEntityRows } from './actionSearchController';

const httpEvent = (body: unknown): HTTPEvent => ({
  path: '/actionSearch',
  query: {},
  body: JSON.stringify(body),
  headers: {},
  method: 'POST',
  correlation: 'test-correlation',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

type QueryPayload = { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { filter?: KvsQueryOperation } };
type QueryAction = Action<QueryPayload>;

const isCondition = (operation: KvsQueryOperation): operation is KvsQueryCondition => 'key' in operation;

const flattenConditions = (operation: KvsQueryOperation): KvsQueryCondition[] =>
  isCondition(operation) ? [operation] : (operation as KvsLogicalOperator).conditions.flatMap(flattenConditions);

// Answers each kvs query by store name and records the payloads for assertions
const buildQueryMocks = (itemsByStore: Record<string, Record<string, unknown>[]>) => {
  const queries: QueryPayload[] = [];

  const onQuery = (action: QueryAction) => {
    queries.push(action.payload!);

    const { keyValueStoreName, keyCondition } = action.payload!;
    const storeItems = itemsByStore[keyValueStoreName] ?? [];

    // Point lookups (linkKey equality) filter; window queries return the store as-is
    const conditions = flattenConditions(keyCondition);
    const linkKeyCondition = conditions.find((condition) => condition.key === 'linkKey');
    const items = linkKeyCondition ? storeItems.filter((item) => item.linkKey === linkKeyCondition.valueA) : storeItems;

    return { items };
  };

  const mocks = { [KeyValueStoreActionType.Query]: onQuery };

  return { mocks, queries };
};

describe('actionSearchController', () => {
  describe('listActionRows', () => {
    it('throws NotFound for an unregistered action type', () => {
      const { mocks } = buildQueryMocks({});

      const request = httpEvent({ actionType: 'no-such-action', startIsoDateTime: 'a', endIsoDateTime: 'b', filters: [] });

      expect(() => runStory(listActionRows(request, {}), mocks)).toThrowError(ErrorTypeEnum.NotFound);
    });

    it('queries the action window with schema-validated filters', () => {
      const row = { correlation: 'corr-1', actionIndex: 0, actionType: NetworkActionType.Request, startedAt: '2026-07-24T00:00:01.000Z' };
      const { mocks, queries } = buildQueryMocks({ [QPQ_LOG_ACTIONS_KVS_NAME]: [row] });

      const request = httpEvent({
        actionType: NetworkActionType.Request,
        startIsoDateTime: '2026-07-24T00:00:00.000Z',
        endIsoDateTime: '2026-07-25T00:00:00.000Z',
        filters: [
          { fieldName: 'status', operator: ActionSearchFilterOperator.Range, rangeStart: '500' },
          { fieldName: 'not-a-field', operator: ActionSearchFilterOperator.Equals, value: 'ignored' },
        ],
      });

      const response = runStory(listActionRows(request, {}), mocks);

      expect(response.status).toBe(200);
      expect(JSON.parse(response.body!).items).toEqual([row]);

      expect(queries).toHaveLength(1);
      expect(queries[0].keyValueStoreName).toBe(QPQ_LOG_ACTIONS_KVS_NAME);

      const keyConditionKeys = flattenConditions(queries[0].keyCondition).map((condition) => condition.key);
      expect(keyConditionKeys).toEqual(['actionType', 'startedAt']);

      const filterKeys = flattenConditions(queries[0].options!.filter!).map((condition) => condition.key);
      expect(filterKeys).toEqual(['status']);
    });
  });

  describe('listEntityRows', () => {
    it('queries the entity window when no lookup filter is present', () => {
      const entity = { linkKey: 'email#msg-1', entityType: 'email', createdAt: '2026-07-24T00:00:01.000Z' };
      const { mocks, queries } = buildQueryMocks({ [QPQ_LOG_ENTITIES_KVS_NAME]: [entity] });

      const request = httpEvent({
        entityType: 'email',
        startIsoDateTime: '2026-07-24T00:00:00.000Z',
        endIsoDateTime: '2026-07-25T00:00:00.000Z',
        filters: [{ fieldName: 'deliveryStatus', operator: ActionSearchFilterOperator.Equals, value: EmailDeliveryStatus.dropped }],
      });

      const response = runStory(listEntityRows(request, {}), mocks);

      expect(JSON.parse(response.body!).items).toEqual([entity]);
      expect(queries[0].keyValueStoreName).toBe(QPQ_LOG_ENTITIES_KVS_NAME);
      expect(flattenConditions(queries[0].keyCondition).map((condition) => condition.key)).toEqual(['entityType', 'createdAt']);
    });

    it('routes an exact recipient filter through the lookup table and applies remaining filters in memory', () => {
      const matching = {
        linkKey: 'email#msg-1',
        entityType: 'email',
        createdAt: '2026-07-24T00:00:01.000Z',
        subject: 'Welcome aboard',
        deliveryStatus: EmailDeliveryStatus.sent,
      };
      const nonMatching = { ...matching, linkKey: 'email#msg-2', subject: 'Password reset' };

      const { mocks, queries } = buildQueryMocks({
        [QPQ_LOG_ENTITY_LOOKUP_KVS_NAME]: [
          { lookupKey: 'email#recipient#joe@x.com', sortValue: '2026-07-24T00:00:01.000Z#email#msg-1', linkKey: 'email#msg-1' },
          { lookupKey: 'email#recipient#joe@x.com', sortValue: '2026-07-24T00:00:02.000Z#email#msg-2', linkKey: 'email#msg-2' },
        ],
        [QPQ_LOG_ENTITIES_KVS_NAME]: [matching, nonMatching],
      });

      const request = httpEvent({
        entityType: 'email',
        startIsoDateTime: '2026-07-24T00:00:00.000Z',
        endIsoDateTime: '2026-07-25T00:00:00.000Z',
        filters: [
          { fieldName: 'recipient', operator: ActionSearchFilterOperator.Exact, value: 'joe@x.com' },
          { fieldName: 'subject', operator: ActionSearchFilterOperator.Contains, value: 'Welcome' },
        ],
      });

      const response = runStory(listEntityRows(request, {}), mocks);

      expect(JSON.parse(response.body!).items).toEqual([matching]);

      expect(queries[0].keyValueStoreName).toBe(QPQ_LOG_ENTITY_LOOKUP_KVS_NAME);
      const lookupCondition = flattenConditions(queries[0].keyCondition).find((condition) => condition.key === 'lookupKey');
      expect(lookupCondition?.valueA).toBe('email#recipient#joe@x.com');
    });

    it('throws NotFound for an unregistered entity type', () => {
      const { mocks } = buildQueryMocks({});

      const request = httpEvent({ entityType: 'no-such-entity', startIsoDateTime: 'a', endIsoDateTime: 'b', filters: [] });

      expect(() => runStory(listEntityRows(request, {}), mocks)).toThrowError(ErrorTypeEnum.NotFound);
    });
  });

  describe('getEntityTimeline', () => {
    it('returns the link key rows in time order', () => {
      const later = {
        correlation: 'corr-2',
        actionIndex: 0,
        actionType: EmailActionType.SendEmail,
        startedAt: '2026-07-24T00:00:02.000Z',
        linkKey: 'email#msg-1',
      };
      const earlier = {
        correlation: 'corr-1',
        actionIndex: 1,
        actionType: EmailActionType.SendEmail,
        startedAt: '2026-07-24T00:00:01.000Z',
        linkKey: 'email#msg-1',
      };

      const { mocks } = buildQueryMocks({ [QPQ_LOG_ACTIONS_KVS_NAME]: [later, earlier] });

      const response = runStory(getEntityTimeline(httpEvent({ linkKey: 'email#msg-1' }), {}), mocks);

      expect(JSON.parse(response.body!).map((row: { correlation: string }) => row.correlation)).toEqual(['corr-1', 'corr-2']);
    });
  });
});
