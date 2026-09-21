import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineStorageDrive, QPQConfig } from 'quidproquo-core';
import {
  defineDns,
  defineEmailReceiver,
  defineEmailReceivingDomain,
  EmailReceiverQPQWebServerConfigSetting,
  qpqWebServerUtils,
} from 'quidproquo-webserver';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreStorageDriveConstruct } from '../../core/storageDrive/QpqCoreStorageDriveConstruct';
import { emailReceiptRuleName } from './emailReceiptRuleName';
import { QPQ_EMAIL_RECEIPT_RULE_SET_NAME } from './emailReceiptRuleSetName';
import { QpqApiWebserverEmailReceiverConstruct } from './QpqApiWebserverEmailReceiverConstruct';

const buildConfig = (withDomain: boolean): QPQConfig =>
  buildTestQpqConfig([
    defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
    defineDns(['example.com', 'example.org']),
    ...(withDomain ? [defineEmailReceivingDomain()] : []),
    defineStorageDrive('mail'),
    defineEmailReceiver('support', { storageDriveName: 'mail' }),
  ]);

const buildStack = () => new Stack(new App(), 'inf', { env: { account: '123456789012', region: 'ap-southeast-2' } });

describe('QpqApiWebserverEmailReceiverConstruct', () => {
  it('adds the app rule to the account rule set, for every root, into the landing bucket', () => {
    const qpqConfig = buildConfig(true);
    const receiver = qpqWebServerUtils.getEmailReceiverConfigs(qpqConfig)[0];
    const stack = buildStack();

    new QpqApiWebserverEmailReceiverConstruct(stack, 'receiver', { qpqConfig, emailReceiverConfig: receiver });

    Template.fromStack(stack).hasResourceProperties('AWS::SES::ReceiptRule', {
      RuleSetName: QPQ_EMAIL_RECEIPT_RULE_SET_NAME,
      Rule: Match.objectLike({
        Name: 'support-test-app-test-module-development',
        Enabled: true,
        Recipients: ['inbox.development.example.com', 'inbox.development.example.org'],
        Actions: [{ S3Action: { BucketName: 'mail-test-app-test-module-development', ObjectKeyPrefix: 'email/support/' } }],
      }),
    });
  });

  it('fails synth when the target drive is missing or scoped', () => {
    const missing = buildTestQpqConfig([
      defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
      defineDns(['example.com']),
      defineEmailReceivingDomain(),
      defineEmailReceiver('support', { storageDriveName: 'ghost' }),
    ]);
    const scoped = buildTestQpqConfig([
      defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
      defineDns(['example.com']),
      defineEmailReceivingDomain(),
      defineStorageDrive('mail', { scoped: true }),
      defineEmailReceiver('support', { storageDriveName: 'mail' }),
    ]);

    const synthWith = (qpqConfig: QPQConfig) =>
      new QpqApiWebserverEmailReceiverConstruct(buildStack(), 'receiver', {
        qpqConfig,
        emailReceiverConfig: qpqWebServerUtils.getEmailReceiverConfigs(qpqConfig)[0],
      });

    expect(() => synthWith(missing)).toThrow(/does not own/);
    expect(() => synthWith(scoped)).toThrow(/scoped/);
  });

  it('fails synth when the drive is declared by another service', () => {
    const qpqConfig = buildTestQpqConfig([
      defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
      defineDns(['example.com']),
      defineEmailReceivingDomain(),
      defineStorageDrive('mail', { owner: { module: 'other', storageDriveName: 'mail' } }),
      defineEmailReceiver('support', { storageDriveName: 'mail' }),
    ]);

    expect(
      () =>
        new QpqApiWebserverEmailReceiverConstruct(buildStack(), 'receiver', {
          qpqConfig,
          emailReceiverConfig: qpqWebServerUtils.getEmailReceiverConfigs(qpqConfig)[0],
        }),
    ).toThrow(/does not own/);
  });

  it('fails synth when the app has no receiving domain', () => {
    const qpqConfig = buildConfig(false);
    const receiver = qpqWebServerUtils.getEmailReceiverConfigs(qpqConfig)[0];

    expect(() => new QpqApiWebserverEmailReceiverConstruct(buildStack(), 'receiver', { qpqConfig, emailReceiverConfig: receiver })).toThrow(
      /defineEmailReceivingDomain/,
    );
  });
});

describe('landing drive bucket policy', () => {
  it('lets only the app rule in the account rule set write, and nothing else', () => {
    const qpqConfig = buildConfig(true);
    const storageDriveConfig = defineStorageDrive('mail');
    const stack = buildStack();

    new QpqCoreStorageDriveConstruct(stack, 'drive', {
      qpqConfig,
      storageDriveConfig,
      emailReceiptRuleNames: [emailReceiptRuleName(qpqConfig, 'support')],
    });

    Template.fromStack(stack).hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'AllowEmailReceiptRuleWrite',
            Effect: 'Allow',
            Principal: { Service: 'ses.amazonaws.com' },
            Action: 's3:PutObject',
            Condition: {
              StringEquals: {
                'AWS:SourceAccount': '123456789012',
                'AWS:SourceArn': [
                  `arn:aws:ses:ap-southeast-2:123456789012:receipt-rule-set/${QPQ_EMAIL_RECEIPT_RULE_SET_NAME}:receipt-rule/support-test-app-test-module-development`,
                ],
              },
            },
          }),
        ]),
      },
    });
  });

  it('adds no SES statement to an ordinary drive', () => {
    const qpqConfig = buildConfig(true);
    const stack = buildStack();
    new QpqCoreStorageDriveConstruct(stack, 'drive', { qpqConfig, storageDriveConfig: defineStorageDrive('assets') });

    Template.fromStack(stack).resourceCountIs('AWS::S3::BucketPolicy', 0);
  });
});
