import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineUserDirectory } from 'quidproquo-core';

import { App, aws_iam, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqInfCoreUserDirectoryConstruct } from './QpqInfCoreUserDirectoryConstruct';

const env = { account: '123456789012', region: 'ap-southeast-2' };

// A service ('ca') that references a user directory owned by another service ('auth')
// in the same account.
const referenced = defineUserDirectory('users', { owner: { module: 'auth' } });
const qpqConfig = buildTestQpqConfig(
  [defineAwsServiceAccountInfo(env.account, env.region, [{ moduleName: 'auth', awsAccountId: env.account, awsRegion: env.region }]), referenced],
  { moduleName: 'ca' },
);

const buildRole = () => {
  const stack = new Stack(new App(), 'test-svc', { env });
  const role = new aws_iam.Role(stack, 'role', { assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com') });
  return { stack, role };
};

describe('QpqInfCoreUserDirectoryConstruct.authorizeReadActionsForRole', () => {
  it('grants read-only user lookups on a referenced (foreign-owned) pool via its exported pool id', () => {
    const { stack, role } = buildRole();

    QpqInfCoreUserDirectoryConstruct.authorizeReadActionsForRole(role, [referenced], qpqConfig);

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: ['cognito-idp:ListUsers', 'cognito-idp:AdminGetUser'],
            // The pool id comes from the owner's stack export, composed into the pool ARN.
            Resource: Match.objectLike({ 'Fn::Join': Match.anyValue() }),
          }),
        ]),
      },
    });

    const json = JSON.stringify(Template.fromStack(stack).toJSON());
    expect(json).toContain('Fn::ImportValue');
    expect(json).not.toContain('AdminCreateUser');
  });

  it('skips a directory owned in another account (no cross-account Cognito grants)', () => {
    const { stack, role } = buildRole();
    const foreignConfig = buildTestQpqConfig(
      [defineAwsServiceAccountInfo(env.account, env.region, [{ moduleName: 'auth', awsAccountId: '999999999999', awsRegion: env.region }]), referenced],
      { moduleName: 'ca' },
    );

    QpqInfCoreUserDirectoryConstruct.authorizeReadActionsForRole(role, [referenced], foreignConfig);

    expect(Template.fromStack(stack).findResources('AWS::IAM::Policy')).toEqual({});
  });
});
