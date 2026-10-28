import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, defineQueue, QueueQPQConfigSetting } from '@qpqjs/core';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreQueueConstruct } from './QpqCoreQueueConstruct';

const synth = (queueConfig: QueueQPQConfigSetting) => {
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), queueConfig]);
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
