import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, defineEventBus, EventBusQPQConfigSetting } from '@qpqjs/core';

import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreEventBusConstruct } from './QpqCoreEventBusConstruct';

const synth = (eventBusConfig: EventBusQPQConfigSetting, feature?: string) => {
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), eventBusConfig], { feature });
  const stack = new Stack(new App(), 'inf', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new QpqCoreEventBusConstruct(stack, 'bus', { qpqConfig, eventBusConfig });

  return Template.fromStack(stack);
};

const subscribeStatements = (template: Template) =>
  Object.values(template.findResources('AWS::SNS::TopicPolicy'))
    .flatMap((policy: any) => policy.Properties.PolicyDocument.Statement)
    .filter((statement: any) => [statement.Action].flat().includes('sns:Subscribe'));

// Security regression: a bus carries cross-service sessions, so only this app's own queues may subscribe. An
// account-wide grant would let another app in the shared account attach a queue and read every message.
describe('QpqCoreEventBusConstruct subscribe policy', () => {
  it('lets the account subscribe only sqs queues named for this app and environment', () => {
    const [statement] = subscribeStatements(synth(defineEventBus('events')));

    expect(statement).toBeDefined();
    expect(statement.Condition.StringEquals['sns:Protocol']).toBe('sqs');
    expect(statement.Condition.StringLike['sns:Endpoint']).toEqual([
      'arn:aws:sqs:*:123456789012:*-test-app-*-development',
      'arn:aws:sqs:*:123456789012:*-test-app-*-development.fifo',
    ]);
  });

  it('keeps the feature in the endpoint pattern for a feature deployment', () => {
    const [statement] = subscribeStatements(synth(defineEventBus('events'), 'joe'));

    expect(statement.Condition.StringLike['sns:Endpoint']).toEqual([
      'arn:aws:sqs:*:123456789012:*-test-app-*-development-joe',
      'arn:aws:sqs:*:123456789012:*-test-app-*-development-joe.fifo',
    ]);
  });

  it('never grants subscribe without a condition', () => {
    const unconditioned = subscribeStatements(synth(defineEventBus('events'))).filter((statement: any) => !statement.Condition);

    expect(unconditioned).toEqual([]);
  });
});
