import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig } from '@qpqjs/core';

import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { WebserverRoll } from './WebserverRoll';

const synth = () => {
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2')]);
  const stack = new Stack(new App(), 'api', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new WebserverRoll(stack, 'roll', { qpqConfig });

  return Template.fromStack(stack);
};

const policyStatements = (template: Template) =>
  Object.values(template.findResources('AWS::IAM::Policy')).flatMap((policy: any) => policy.Properties.PolicyDocument.Statement);

const trustPrincipals = (template: Template) =>
  Object.values(template.findResources('AWS::IAM::Role')).flatMap((role: any) =>
    role.Properties.AssumeRolePolicyDocument.Statement.flatMap((statement: any) => statement.Principal.Service),
  );

// Security regression: the service role shares an account with other apps, so it may write its own logs but never read
// log groups (which would include every other app's), and it is assumable only by the services that actually run it.
describe('WebserverRoll', () => {
  it('can write logs but never read any log group in the account', () => {
    const actions = policyStatements(synth()).flatMap((statement: any) => statement.Action);

    expect(actions).toContain('logs:PutLogEvents');
    expect(actions).not.toContain('logs:GetLogEvents');
    expect(actions).not.toContain('logs:FilterLogEvents');
    expect(actions).not.toContain('logs:DescribeLogStreams');
  });

  it('is assumable only by lambda and lambda@edge', () => {
    expect(trustPrincipals(synth()).sort()).toEqual(['edgelambda.amazonaws.com', 'lambda.amazonaws.com']);
  });

  it('never allows a tag mutation that could move the ownership boundary', () => {
    const actions = policyStatements(synth())
      .filter((statement: any) => statement.Effect === 'Allow')
      .flatMap((statement: any) => statement.Action);

    expect(actions.filter((action: string) => /TagResource|Tagging|TagsToResource|TagsFromResource|^tag:/.test(action))).toEqual([]);
  });
});
