import { defineAccountCloudTrail, defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';

import { QpqAccountCloudTrailConstruct } from './QpqAccountCloudTrailConstruct';

const synth = () => {
  const cloudTrailConfig = defineAccountCloudTrail('audit');
  const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), cloudTrailConfig]);
  const stack = new Stack(new App(), 'account', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new QpqAccountCloudTrailConstruct(stack, 'trail', { qpqConfig, cloudTrailConfig });

  return Template.fromStack(stack);
};

// Security regression: the audit trail is tamper-evident (file validation on), covers every region and the
// global services, and lands in a bucket that blocks public access, refuses plain http and is retained.
describe('QpqAccountCloudTrailConstruct', () => {
  it('validates log files and covers all regions and global events by default', () => {
    synth().hasResourceProperties('AWS::CloudTrail::Trail', {
      EnableLogFileValidation: true,
      IsMultiRegionTrail: true,
      IncludeGlobalServiceEvents: true,
    });
  });

  it('keeps the log bucket private, ssl-only and retained', () => {
    const template = synth();

    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Retain',
      Properties: Match.objectLike({
        PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true },
      }),
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([Match.objectLike({ Effect: 'Deny', Condition: { Bool: { 'aws:SecureTransport': 'false' } } })]),
      },
    });
  });
});
