import { defineAccountGithubOidcProvider, defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig } from 'quidproquo-core';

import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';

import { AccountQpqStack } from './AccountQpqStack';

const synth = (withProvider: boolean) => {
  const qpqConfig = buildTestQpqConfig([
    defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
    ...(withProvider ? [defineAccountGithubOidcProvider()] : []),
  ]);
  return Template.fromStack(new AccountQpqStack(new App(), 'qpq-account', { qpqConfig }));
};

describe('AccountQpqStack github oidc provider', () => {
  it('creates nothing unless declared', () => {
    synth(false).resourceCountIs('Custom::AWSCDKOpenIdConnectProvider', 0);
  });

  it('creates the GitHub provider for the sts audience', () => {
    synth(true).hasResourceProperties('Custom::AWSCDKOpenIdConnectProvider', {
      Url: 'https://token.actions.githubusercontent.com',
      ClientIDList: ['sts.amazonaws.com'],
    });
  });
});
