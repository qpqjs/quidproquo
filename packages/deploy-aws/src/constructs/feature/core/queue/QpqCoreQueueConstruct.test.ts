import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, defineEventBus, defineQueue, QPQConfig, QueueQPQConfigSetting } from '@qpqjs/core';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreQueueConstruct } from './QpqCoreQueueConstruct';

const synth = (queueConfig: QueueQPQConfigSetting, extra: QPQConfig = []) => {
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), queueConfig, ...extra]);
  const stack = new Stack(new App(), 'inf', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new QpqCoreQueueConstruct(stack, 'queue', { qpqConfig, queueConfig });

  return Template.fromStack(stack);
};

const isSslDeny = (statement: any) =>
  statement.Effect === 'Deny' && statement.Action === 'sqs:*' && statement.Condition?.Bool?.['aws:SecureTransport'] === 'false';

// Security regression: both the main queue and its dead letter queue refuse plain-http requests, so a message body
// (which embeds a story session) can never travel unencrypted.
describe('QpqCoreQueueConstruct transport', () => {
  it('denies plain http on the main queue and the dead letter queue', () => {
    const template = synth(defineQueue('jobs', 'src/jobs', {}));
    const policies = Object.values(template.findResources('AWS::SQS::QueuePolicy'));
    const queuesWithSslDeny = policies
      .filter((policy: any) => policy.Properties.PolicyDocument.Statement.some(isSslDeny))
      .flatMap((policy: any) => policy.Properties.Queues);

    template.resourceCountIs('AWS::SQS::Queue', 2);
    expect(queuesWithSslDeny).toHaveLength(2);
    template.hasResourceProperties('AWS::SQS::QueuePolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([Match.objectLike({ Effect: 'Deny', Action: 'sqs:*', Condition: { Bool: { 'aws:SecureTransport': 'false' } } })]),
      },
    });
  });
});

const snsSendStatements = (template: Template) =>
  Object.values(template.findResources('AWS::SQS::QueuePolicy'))
    .flatMap((policy: any) => policy.Properties.PolicyDocument.Statement)
    .filter((statement: any) => statement.Principal?.Service === 'sns.amazonaws.com');

const sourceArns = (template: Template): string[] =>
  snsSendStatements(template).flatMap((statement: any) => {
    const arn = statement.Condition?.ArnEquals?.['aws:SourceArn'];
    return Array.isArray(arn) ? arn : [arn];
  });

// Security regression: a queue message body carries the sender's session, which the handler trusts, so only the
// topics this queue subscribes to may deliver into it. In a shared account "any topic in the account" would let
// another app's topic inject messages with a forged identity.
describe('QpqCoreQueueConstruct sns delivery policy', () => {
  it('grants send only to the exact topics the queue subscribes to', () => {
    const template = synth(defineQueue('jobs', 'src/jobs', { eventBusSubscriptions: ['events'] }), [defineEventBus('events')]);

    expect(sourceArns(template)).toEqual(['arn:aws:sns:ap-southeast-2:123456789012:events-test-app-test-module-development']);
  });

  it("resolves a bus owned by another module to that owner's topic", () => {
    const template = synth(defineQueue('jobs', 'src/jobs', { eventBusSubscriptions: ['events'] }), [
      defineEventBus('events', { owner: { module: 'other' } }),
    ]);

    expect(sourceArns(template)).toEqual(['arn:aws:sns:ap-southeast-2:123456789012:events-test-app-other-development']);
  });

  it('never carries a wildcard source arn', () => {
    const template = synth(defineQueue('jobs', 'src/jobs', { eventBusSubscriptions: ['events'] }), [defineEventBus('events')]);

    expect(sourceArns(template).some((arn) => arn.includes('*'))).toBe(false);
  });

  it('grants sns nothing when the queue subscribes to no bus', () => {
    expect(snsSendStatements(synth(defineQueue('jobs', 'src/jobs', {})))).toEqual([]);
  });
});
