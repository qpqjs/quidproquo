import { awsNamingUtils, defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { defineStorageDrive, QPQConfig } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';
import { defineDns, defineEmailReceiver, defineEmailReceivingDomain, qpqWebServerUtils } from '@qpqjs/webserver';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreStorageDriveConstruct } from '../../core/storageDrive/QpqCoreStorageDriveConstruct';
import { QpqApiWebserverEmailReceiverConstruct } from './QpqApiWebserverEmailReceiverConstruct';

const onEmail = '/entry/email/onEmail::onEmail';

const buildConfig = (withDomain: boolean): QPQConfig =>
  buildTestQpqConfig([
    defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
    defineDns(['example.com', 'example.org']),
    ...(withDomain ? [defineEmailReceivingDomain()] : []),
    defineEmailReceiver('support', { onEmail }),
  ]);

const buildStack = () => new Stack(new App(), 'inf', { env: { account: '123456789012', region: 'ap-southeast-2' } });

describe('QpqApiWebserverEmailReceiverConstruct', () => {
  it('adds the app rule to the account rule set, for every root, into the landing bucket', () => {
    const qpqConfig = buildConfig(true);
    const receiver = qpqWebServerUtils.getAllEmailReceiverConfigs(qpqConfig)[0];
    const stack = buildStack();

    new QpqApiWebserverEmailReceiverConstruct(stack, 'receiver', { qpqConfig, emailReceiverConfig: receiver });

    Template.fromStack(stack).hasResourceProperties('AWS::SES::ReceiptRule', {
      RuleSetName: awsNamingUtils.QPQ_EMAIL_RECEIPT_RULE_SET_NAME,
      Rule: Match.objectLike({
        Name: 'support-test-app-test-module-development',
        Enabled: true,
        Recipients: ['inbox.development.example.com', 'inbox.development.example.org'],
        Actions: [{ S3Action: { BucketName: 'email-support-test-app-test-module-development' } }],
      }),
    });
  });

  it('fails synth when the receiver setting is present without its drive', () => {
    const [receiver] = defineEmailReceiver('support', { onEmail });
    const qpqConfig = buildTestQpqConfig([
      defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
      defineDns(['example.com']),
      defineEmailReceivingDomain(),
      receiver,
    ]);

    expect(
      () =>
        new QpqApiWebserverEmailReceiverConstruct(buildStack(), 'receiver', {
          qpqConfig,
          emailReceiverConfig: qpqWebServerUtils.getAllEmailReceiverConfigs(qpqConfig)[0],
        }),
    ).toThrow(/no storage drive/);
  });

  it('fails synth when the app has no receiving domain', () => {
    const qpqConfig = buildConfig(false);
    const receiver = qpqWebServerUtils.getAllEmailReceiverConfigs(qpqConfig)[0];

    expect(() => new QpqApiWebserverEmailReceiverConstruct(buildStack(), 'receiver', { qpqConfig, emailReceiverConfig: receiver })).toThrow(
      /defineEmailReceivingDomain/,
    );
  });
});

describe('landing drive bucket policy', () => {
  it('lets only the app rule in the account rule set write, and nothing else', () => {
    const qpqConfig = buildConfig(true);
    const storageDriveConfig = defineStorageDrive('email-support');
    const stack = buildStack();

    new QpqCoreStorageDriveConstruct(stack, 'drive', {
      qpqConfig,
      storageDriveConfig,
      emailReceiptRuleNames: [awsNamingUtils.getEmailReceiptRuleName('support', qpqConfig)],
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
                  `arn:aws:ses:ap-southeast-2:123456789012:receipt-rule-set/${awsNamingUtils.QPQ_EMAIL_RECEIPT_RULE_SET_NAME}:receipt-rule/support-test-app-test-module-development`,
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

    const policies = Template.fromStack(stack).findResources('AWS::S3::BucketPolicy');
    const statements = Object.values(policies).flatMap((policy: any) => policy.Properties.PolicyDocument.Statement);

    expect(statements.some((statement: any) => statement.Principal?.Service === 'ses.amazonaws.com')).toBe(false);
  });
});
