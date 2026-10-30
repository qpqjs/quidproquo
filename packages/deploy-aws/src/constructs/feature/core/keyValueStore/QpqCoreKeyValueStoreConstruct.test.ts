import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { defineKeyValueStore, KeyValueStoreQPQConfigSetting, kvsKey } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreKeyValueStoreConstruct } from './QpqCoreKeyValueStoreConstruct';

const synth = (keyValueStoreConfig: KeyValueStoreQPQConfigSetting) => {
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), keyValueStoreConfig]);
  const stack = new Stack(new App(), 'test', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new QpqCoreKeyValueStoreConstruct(stack, 'kvs', { qpqConfig, keyValueStoreConfig });

  return Template.fromStack(stack);
};

type Order = { id: string; updatedAt: string; level: number; score: number };

const indexes = [
  { partitionKey: kvsKey<Order>('level', 'number'), sortKey: kvsKey<Order>('score', 'number') },
  { partitionKey: kvsKey<Order>('id'), sortKey: kvsKey<Order>('updatedAt') },
];

describe('QpqCoreKeyValueStoreConstruct global secondary indexes', () => {
  it("keys a scoped store's GSI on the hidden copy of its partition key, keeping the declared name and raw sort key", () => {
    synth(defineKeyValueStore<Order>('orders', 'id', [], { scoped: true, indexes })).hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'level',
          KeySchema: [
            { AttributeName: '@@QPQGSI_level@@', KeyType: 'HASH' },
            { AttributeName: 'score', KeyType: 'RANGE' },
          ],
        }),
        Match.objectLike({
          IndexName: 'id',
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
            { AttributeName: 'updatedAt', KeyType: 'RANGE' },
          ],
        }),
      ]),
      AttributeDefinitions: Match.arrayWith([
        { AttributeName: '@@QPQGSI_level@@', AttributeType: 'S' },
        { AttributeName: 'score', AttributeType: 'N' },
      ]),
    });
  });

  it("keys an unscoped store's GSI on the declared attribute", () => {
    synth(defineKeyValueStore<Order>('open', 'id', [], { indexes })).hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'level',
          KeySchema: [
            { AttributeName: 'level', KeyType: 'HASH' },
            { AttributeName: 'score', KeyType: 'RANGE' },
          ],
        }),
      ]),
      AttributeDefinitions: Match.arrayWith([{ AttributeName: 'level', AttributeType: 'N' }]),
    });
  });

  it('deploys an explicitly named index under its name, sharing the hidden partition key copy', () => {
    const store = defineKeyValueStore<Order>('orders', 'id', [], {
      scoped: true,
      indexes: [
        { partitionKey: kvsKey<Order>('level', 'number'), sortKey: kvsKey<Order>('score', 'number') },
        { name: 'levelByUpdated', partitionKey: kvsKey<Order>('level', 'number'), sortKey: kvsKey<Order>('updatedAt') },
      ],
    });

    synth(store).hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({ IndexName: 'level', KeySchema: Match.arrayWith([{ AttributeName: '@@QPQGSI_level@@', KeyType: 'HASH' }]) }),
        Match.objectLike({
          IndexName: 'levelByUpdated',
          KeySchema: [
            { AttributeName: '@@QPQGSI_level@@', KeyType: 'HASH' },
            { AttributeName: 'updatedAt', KeyType: 'RANGE' },
          ],
        }),
      ]),
    });
  });
});

// Security regression: a store table is retained with deletion protection, keeps point in time
// recovery on, bills per request and opens no stream unless a handler is configured.
describe('QpqCoreKeyValueStoreConstruct table defaults', () => {
  it('retains the table with deletion protection, point in time recovery and no stream', () => {
    const template = synth(defineKeyValueStore<Order>('orders', 'id'));

    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
      Properties: Match.objectLike({
        DeletionProtectionEnabled: true,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        StreamSpecification: Match.absent(),
      }),
    });
  });

  it('turns point in time recovery off only when the store opts out', () => {
    const template = synth(defineKeyValueStore<Order>('orders', 'id', [], { disablePointInTimeRecovery: true }));
    const tables = Object.values(template.findResources('AWS::DynamoDB::Table'));

    expect((tables[0] as any).Properties.PointInTimeRecoverySpecification).toEqual({ PointInTimeRecoveryEnabled: false });
    expect((tables[0] as any).Properties.DeletionProtectionEnabled).toBe(true);
  });
});
