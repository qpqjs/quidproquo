import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig } from 'quidproquo-core';

import { App, aws_iam, aws_lambda, aws_lambda_event_sources, aws_sqs, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqServiceRole } from './QpqServiceRole';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2')]);

const buildStack = () => new Stack(new App(), 'test-api', { env: { account: '123456789012', region: 'ap-southeast-2' } });

const queueArn = (index: number) => `arn:aws:sqs:ap-southeast-2:123456789012:queue-with-a-reasonably-long-name-${index}`;

const addQueueConsumer = (stack: Stack, index: number) => {
  const role = QpqServiceRole.of(stack, qpqConfig);
  const fn = new aws_lambda.Function(stack, `fn${index}`, {
    runtime: aws_lambda.Runtime.NODEJS_22_X,
    handler: 'index.handler',
    code: aws_lambda.Code.fromInline('exports.handler = () => {};'),
    role,
  });
  const queue = aws_sqs.Queue.fromQueueAttributes(stack, `q${index}`, { queueArn: queueArn(index) });
  fn.addEventSource(new aws_lambda_event_sources.SqsEventSource(queue));
};

describe('QpqServiceRole', () => {
  it('is one construct per stack', () => {
    const stack = buildStack();

    expect(QpqServiceRole.of(stack, qpqConfig)).toBe(QpqServiceRole.of(stack, qpqConfig));
  });

  it('routes event-source grants into one merged managed policy instead of inline policies', () => {
    const stack = buildStack();
    for (let index = 0; index < 5; index += 1) {
      addQueueConsumer(stack, index);
    }

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::IAM::Policy', 0);
    template.resourceCountIs('AWS::IAM::ManagedPolicy', 1);

    const [policy] = Object.values(template.findResources('AWS::IAM::ManagedPolicy'));
    expect(policy.Properties.Roles).toEqual(['service-role-test-app-test-module-development']);
    expect(policy.Properties.PolicyDocument.Statement).toHaveLength(1);
    expect(policy.Properties.PolicyDocument.Statement[0].Resource).toHaveLength(5);
  });

  it('starts a new managed policy before a chunk would exceed the document limit', () => {
    const stack = buildStack();
    const role = QpqServiceRole.of(stack, qpqConfig);
    for (let index = 0; index < 120; index += 1) {
      role.addToPrincipalPolicy(new aws_iam.PolicyStatement({ actions: ['sqs:SendMessage'], resources: [queueArn(index)] }));
    }

    const policies = Object.values(Template.fromStack(stack).findResources('AWS::IAM::ManagedPolicy'));
    expect(policies.length).toBeGreaterThan(1);
    policies.forEach((policy) => {
      expect(JSON.stringify(policy.Properties.PolicyDocument).length).toBeLessThanOrEqual(6144);
    });
  });
});
