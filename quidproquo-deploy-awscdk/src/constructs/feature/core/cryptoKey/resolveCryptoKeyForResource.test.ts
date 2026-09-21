import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineCryptoKey, defineKeyValueStore, defineStorageDrive, QPQConfig } from 'quidproquo-core';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreKeyValueStoreConstruct } from '../keyValueStore/QpqCoreKeyValueStoreConstruct';
import { QpqCoreStorageDriveConstruct } from '../storageDrive/QpqCoreStorageDriveConstruct';
import { QpqCoreCryptoKeyConstruct } from './QpqCoreCryptoKeyConstruct';
import { OwnedCryptoKeys, resolveCryptoKeyForResource } from './resolveCryptoKeyForResource';

const buildConfig = (...settings: QPQConfig): QPQConfig =>
  buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), ...settings]);

const buildStack = () => {
  const app = new App();
  return new Stack(app, 'inf', { env: { account: '123456789012', region: 'ap-southeast-2' } });
};

// Mirrors the inf stack: owned keys are built first and handed down by name.
const buildOwnedKeys = (stack: Stack, qpqConfig: QPQConfig): OwnedCryptoKeys => {
  const owned: OwnedCryptoKeys = {};
  for (const cryptoKeyConfig of [defineCryptoKey('main')]) {
    owned[cryptoKeyConfig.keyName] = new QpqCoreCryptoKeyConstruct(stack, cryptoKeyConfig.keyName, { qpqConfig, cryptoKeyConfig }).key;
  }
  return owned;
};

describe('resolveCryptoKeyForResource', () => {
  it('encrypts a drive and a store with the owned key built in the same stack', () => {
    const drive = defineStorageDrive('uploads', { cryptoKeyName: 'main' });
    const store = defineKeyValueStore('billing', 'invoiceId', [], { cryptoKeyName: 'main' });
    const qpqConfig = buildConfig(defineCryptoKey('main'), drive, store);
    const stack = buildStack();
    const owned = buildOwnedKeys(stack, qpqConfig);

    new QpqCoreStorageDriveConstruct(stack, 'drive', {
      qpqConfig,
      storageDriveConfig: drive,
      cryptoKey: resolveCryptoKeyForResource(stack, 'drive-key', qpqConfig, 'main', owned),
    });
    new QpqCoreKeyValueStoreConstruct(stack, 'store', {
      qpqConfig,
      keyValueStoreConfig: store,
      cryptoKey: resolveCryptoKeyForResource(stack, 'store-key', qpqConfig, 'main', owned),
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          Match.objectLike({
            ServerSideEncryptionByDefault: { SSEAlgorithm: 'aws:kms', KMSMasterKeyID: { 'Fn::GetAtt': [Match.stringLikeRegexp('^main'), 'Arn'] } },
          }),
        ],
      },
    });
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      SSESpecification: { SSEEnabled: true, SSEType: 'KMS', KMSMasterKeyId: { 'Fn::GetAtt': [Match.stringLikeRegexp('^main'), 'Arn'] } },
    });
  });

  it('references a foreign key by its derived alias', () => {
    const drive = defineStorageDrive('uploads', { cryptoKeyName: 'shared' });
    const qpqConfig = buildConfig(defineCryptoKey('shared', { owner: { module: 'shell', cryptoKeyName: 'shared' } }), drive);
    const stack = buildStack();

    const key = resolveCryptoKeyForResource(stack, 'drive-key', qpqConfig, 'shared', {});
    new QpqCoreStorageDriveConstruct(stack, 'drive', { qpqConfig, storageDriveConfig: drive, cryptoKey: key });

    // The alias ARN is assembled from the stack's region and account tokens, so
    // it renders as a join; the alias segment is the part that matters.
    const [bucket] = Object.values(Template.fromStack(stack).findResources('AWS::S3::Bucket'));
    const keyId = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID;

    expect(JSON.stringify(keyId)).toMatch(/:alias\/shared-test-app-shell-development/);
  });

  it('fails synth when the named key is not declared', () => {
    const qpqConfig = buildConfig(defineStorageDrive('uploads', { cryptoKeyName: 'ghost' }));

    expect(() => resolveCryptoKeyForResource(buildStack(), 'k', qpqConfig, 'ghost', {})).toThrow(/ghost/);
  });

  it('fails synth when a drive names a key but none was resolved for it', () => {
    const drive = defineStorageDrive('uploads', { cryptoKeyName: 'main' });
    const qpqConfig = buildConfig(defineCryptoKey('main'), drive);

    expect(() => new QpqCoreStorageDriveConstruct(buildStack(), 'drive', { qpqConfig, storageDriveConfig: drive })).toThrow(/none was resolved/);
  });

  it('leaves a drive on provider-managed encryption when no key is named', () => {
    const drive = defineStorageDrive('uploads');
    const qpqConfig = buildConfig(drive);
    const stack = buildStack();
    new QpqCoreStorageDriveConstruct(stack, 'drive', { qpqConfig, storageDriveConfig: drive });

    Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [Match.objectLike({ ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } })],
      },
    });
  });
});
