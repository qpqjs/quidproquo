import { defineAwsGithubDeployRole, defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig } from 'quidproquo-core';

import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { BootstrapQpqServiceStack } from './BootstrapQpqServiceStack';

const synth = (withRole: boolean) => {
  const qpqConfig = buildTestQpqConfig([
    defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
    ...(withRole ? [defineAwsGithubDeployRole('qpqjs/quidproquo', { ownerId: 314167689, repositoryId: 571382961 })] : []),
  ]);
  return Template.fromStack(new BootstrapQpqServiceStack(new App(), 'test-bs', { qpqConfig }));
};

describe('BootstrapQpqServiceStack github deploy role', () => {
  it('creates nothing when the config declares no role', () => {
    synth(false).resourceCountIs('AWS::IAM::Role', 0);
  });

  it('trusts the account provider for both subject claim forms of the deploy environment', () => {
    const template = synth(true);

    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'github-actions-deploy-test-app-development',
      ManagedPolicyArns: [Match.objectLike({ 'Fn::Join': Match.anyValue() })],
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 'sts:AssumeRoleWithWebIdentity',
            Principal: { Federated: 'arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com' },
            Condition: {
              StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                'token.actions.githubusercontent.com:sub': [
                  'repo:qpqjs/quidproquo:environment:development',
                  'repo:qpqjs@314167689/quidproquo@571382961:environment:development',
                ],
              },
            },
          }),
        ],
      },
    });
    expect(Object.keys(template.findOutputs('*'))).toHaveLength(1);
  });
});
