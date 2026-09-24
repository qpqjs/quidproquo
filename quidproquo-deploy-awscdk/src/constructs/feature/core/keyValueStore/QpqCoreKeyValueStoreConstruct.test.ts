import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineKeyValueStore, KeyValueStoreQPQConfigSetting, kvsKey } from 'quidproquo-core';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';

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
});
