import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineStorageDrive, QPQConfig, StorageDriveQPQConfigSetting } from 'quidproquo-core';

import { App, aws_iam, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { QpqCoreStorageDriveConstruct } from './QpqCoreStorageDriveConstruct';

const buildConfig = (storageDriveConfig: StorageDriveQPQConfigSetting): QPQConfig =>
  buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), storageDriveConfig]);

const synth = (storageDriveConfig: StorageDriveQPQConfigSetting, withRole: boolean = true) => {
  const app = new App();
  const stack = new Stack(app, 'inf', { env: { account: '123456789012', region: 'ap-southeast-2' } });
  const serviceRole = withRole ? new aws_iam.Role(stack, 'role', { assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com') }) : undefined;

  new QpqCoreStorageDriveConstruct(stack, 'drive', { qpqConfig: buildConfig(storageDriveConfig), storageDriveConfig, serviceRole });

  return Template.fromStack(stack);
};

describe('QpqCoreStorageDriveConstruct lockedDown', () => {
  it('denies object reads to every principal except the service role', () => {
    const template = synth(defineStorageDrive('logs', { lockedDown: true }));

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'DenyObjectReadExceptServiceRole',
            Effect: 'Deny',
            Principal: { AWS: '*' },
            Action: ['s3:GetObject', 's3:GetObjectVersion'],
            Condition: { ArnNotEquals: { 'aws:PrincipalArn': [{ 'Fn::GetAtt': [Match.stringLikeRegexp('^role'), 'Arn'] }] } },
          }),
        ]),
      },
    });
  });

  it('never denies listing or bucket management', () => {
    const template = synth(defineStorageDrive('logs', { lockedDown: true }));
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const statements = Object.values(policies).flatMap((policy: any) => policy.Properties.PolicyDocument.Statement);
    const denied = statements.filter((statement: any) => statement.Effect === 'Deny').flatMap((statement: any) => statement.Action);

    expect(denied).toEqual(['s3:GetObject', 's3:GetObjectVersion']);
  });

  it('adds no deny when the drive is not lockedDown', () => {
    const template = synth(defineStorageDrive('logs'));

    template.resourceCountIs('AWS::S3::BucketPolicy', 0);
  });

  it('fails synth when lockedDown without a service role', () => {
    expect(() => synth(defineStorageDrive('logs', { lockedDown: true }), false)).toThrow(/lockedDown/);
  });
});
