import { defineAwsGithubDeployRole, defineAwsServiceAccountInfo, defineDomainCertificate } from 'quidproquo-config-aws';
import { buildTestQpqConfig } from 'quidproquo-core';
import { defineDns, defineEmailReceivingDomain } from 'quidproquo-webserver';

import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { BootstrapQpqServiceStack } from './BootstrapQpqServiceStack';

const synth = (withRole: boolean, trustNameForm?: boolean) => {
  const qpqConfig = buildTestQpqConfig([
    defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
    defineDomainCertificate('us-east-1', [{ subdomain: 'www' }]),
    ...(withRole ? [defineAwsGithubDeployRole('qpqjs/quidproquo', { ownerId: 314167689, repositoryId: 571382961, trustNameForm })] : []),
  ]);
  return Template.fromStack(new BootstrapQpqServiceStack(new App(), 'test-bs', { qpqConfig }));
};

describe('BootstrapQpqServiceStack github deploy role', () => {
  it('creates nothing when the config declares no role', () => {
    synth(false).resourceCountIs('AWS::IAM::Role', 0);
  });

  it('trusts the account provider for the immutable-id subject of the deploy environment only', () => {
    const template = synth(true);

    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'github-actions-deploy-test-app-development',
      ManagedPolicyArns: Match.absent(),
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 'sts:AssumeRoleWithWebIdentity',
            Principal: { Federated: 'arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com' },
            Condition: {
              StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                'token.actions.githubusercontent.com:sub': ['repo:qpqjs@314167689/quidproquo@571382961:environment:development'],
              },
            },
          }),
        ],
      },
    });
    expect(Object.keys(template.findOutputs('*'))).toHaveLength(1);
  });

  it('adds the name-form subject when asked', () => {
    synth(true, true).hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Condition: {
              StringEquals: Match.objectLike({
                'token.actions.githubusercontent.com:sub': [
                  'repo:qpqjs@314167689/quidproquo@571382961:environment:development',
                  'repo:qpqjs/quidproquo:environment:development',
                ],
              }),
            },
          }),
        ],
      },
    });
  });

  it('grants only the cdk bootstrap roles in every deploy region, the app buckets and the deploy parameters', () => {
    synth(true).hasResourceProperties('AWS::IAM::Role', {
      Policies: [
        {
          PolicyName: 'deploy',
          PolicyDocument: {
            Statement: [
              Match.objectLike({
                Sid: 'AssumeCdkBootstrapRoles',
                Action: 'sts:AssumeRole',
                Resource: Match.arrayWith([
                  'arn:aws:iam::123456789012:role/cdk-hnb659fds-deploy-role-123456789012-ap-southeast-2',
                  'arn:aws:iam::123456789012:role/cdk-hnb659fds-lookup-role-123456789012-us-east-1',
                ]),
              }),
              Match.objectLike({ Sid: 'ListAppBuckets', Resource: 'arn:aws:s3:::*-test-app-*-development' }),
              Match.objectLike({ Sid: 'WriteAppBuckets', Resource: 'arn:aws:s3:::*-test-app-*-development/*' }),
              Match.objectLike({ Sid: 'ReadDeployParameters' }),
            ],
          },
        },
      ],
    });
  });
});

describe('BootstrapQpqServiceStack email receiving domain', () => {
  const synthReceiving = (declared: boolean) => {
    const qpqConfig = buildTestQpqConfig([
      defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
      defineDns(['example.com', 'example.org']),
      ...(declared ? [defineEmailReceivingDomain()] : []),
    ]);
    const app = new App();
    return Template.fromStack(
      new BootstrapQpqServiceStack(app, 'test-bs', { qpqConfig, env: { account: '123456789012', region: 'ap-southeast-2' } }),
    );
  };

  it('creates nothing unless declared', () => {
    synthReceiving(false).resourceCountIs('AWS::SES::EmailIdentity', 0);
  });

  it('verifies the receiving host of every root and points its MX at SES in the deploy region', () => {
    const template = synthReceiving(true);

    template.resourceCountIs('AWS::SES::EmailIdentity', 2);
    template.hasResourceProperties('AWS::SES::EmailIdentity', { EmailIdentity: 'inbox.development.example.com' });
    template.hasResourceProperties('AWS::SES::EmailIdentity', { EmailIdentity: 'inbox.development.example.org' });

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'MX',
      Name: 'inbox.development.example.com.',
      ResourceRecords: ['10 inbound-smtp.ap-southeast-2.amazonaws.com'],
    });
    // Three DKIM CNAMEs per identity, named exactly as SES hands them out: the token plus a
    // trailing dot, never with the zone appended.
    const cnames = Object.values(template.findResources('AWS::Route53::RecordSet', { Properties: { Type: 'CNAME' } }));
    expect(cnames).toHaveLength(6);
    for (const cname of cnames) {
      const name = JSON.stringify(cname.Properties.Name);
      expect(name).toMatch(/DkimDNSTokenName/);
      expect(name).toMatch(/\.\"\]\]\}$/);
      expect(name).not.toMatch(/development\.example/);
    }
  });
});
