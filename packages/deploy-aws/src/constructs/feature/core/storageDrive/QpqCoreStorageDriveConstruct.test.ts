import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, defineStorageDrive, QPQConfig, StorageDriveQPQConfigSetting } from '@qpqjs/core';

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
    const denied = statements
      .filter((statement: any) => statement.Effect === 'Deny' && statement.Sid === 'DenyObjectReadExceptServiceRole')
      .flatMap((statement: any) => statement.Action);

    expect(denied).toEqual(['s3:GetObject', 's3:GetObjectVersion']);
  });

  it('adds no read deny when the drive is not lockedDown', () => {
    const template = synth(defineStorageDrive('logs'));
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const statements = Object.values(policies).flatMap((policy: any) => policy.Properties.PolicyDocument.Statement);

    expect(statements.some((statement: any) => statement.Sid === 'DenyObjectReadExceptServiceRole')).toBe(false);
  });

  it('fails synth when lockedDown without a service role', () => {
    expect(() => synth(defineStorageDrive('logs', { lockedDown: true }), false)).toThrow(/lockedDown/);
  });
});

// Security regression: every drive bucket blocks all public access, is versioned and carries at least
// SSE-S3; a drive that names a crypto key moves to KMS with the bucket key on.
describe('QpqCoreStorageDriveConstruct bucket hardening', () => {
  it('blocks all public access, versions objects and encrypts with SSE-S3 by default', () => {
    const template = synth(defineStorageDrive('uploads'));

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true },
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [Match.objectLike({ ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } })],
      },
    });
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  it('never grants public read through an ACL or a bucket policy', () => {
    const template = synth(defineStorageDrive('uploads'));
    const buckets = Object.values(template.findResources('AWS::S3::Bucket'));

    expect((buckets[0] as any).Properties.AccessControl).toBeUndefined();
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const statements = Object.values(policies).flatMap((policy: any) => policy.Properties.PolicyDocument.Statement);
    expect(statements.every((statement: any) => statement.Effect === 'Deny')).toBe(true);
  });
});

// Security regression: every drive bucket refuses plain-http requests (Security Hub S3.5), so a presigned url rewritten
// to http:// or an sdk call without tls is denied instead of served.
describe('QpqCoreStorageDriveConstruct transport', () => {
  it.each([
    ['plain drive', defineStorageDrive('uploads')],
    ['lockedDown drive', defineStorageDrive('logs', { lockedDown: true })],
  ])('denies plain http on a %s', (_name, drive) => {
    synth(drive).hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({ Effect: 'Deny', Action: 's3:*', Principal: { AWS: '*' }, Condition: { Bool: { 'aws:SecureTransport': 'false' } } }),
        ]),
      },
    });
  });
});
