import { defineAwsServiceAccountInfo, defineEmailSenderAllowList } from 'quidproquo-config-aws';
import { buildTestQpqConfig } from 'quidproquo-core';

import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';

import { QpqWebserverEmailSenderConstruct } from './QpqWebserverEmailSenderConstruct';

const synth = (...allowLists: string[][]) => {
  const stack = new Stack(new App(), 'test-email-sender');
  QpqWebserverEmailSenderConstruct.createAllowListIdentities(
    stack,
    buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'), ...allowLists.map(defineEmailSenderAllowList)]),
  );
  return Template.fromStack(stack);
};

describe('QpqWebserverEmailSenderConstruct.createAllowListIdentities', () => {
  it('creates nothing without an allow list', () => {
    synth().resourceCountIs('AWS::SES::EmailIdentity', 0);
  });

  it('creates one email identity per allowed address, across calls and without repeats', () => {
    const template = synth(['a@example.com', 'b+1@example.com'], ['b+1@example.com', 'c@example.com']);

    template.resourceCountIs('AWS::SES::EmailIdentity', 3);
    for (const address of ['a@example.com', 'b+1@example.com', 'c@example.com']) {
      template.hasResourceProperties('AWS::SES::EmailIdentity', { EmailIdentity: address });
    }
  });
});
