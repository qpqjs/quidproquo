import { defineAccountEmailReceiving, defineAccountGithubOidcProvider, defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig } from 'quidproquo-core';

import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';

import { QPQ_EMAIL_RECEIPT_RULE_SET_NAME } from '../constructs/feature/webserver/emailReceiving/emailReceiptRuleSetName';
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

describe('AccountQpqStack email receiving', () => {
  const synthReceiving = (declared: boolean) => {
    const qpqConfig = buildTestQpqConfig([
      defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
      ...(declared ? [defineAccountEmailReceiving()] : []),
    ]);
    return Template.fromStack(new AccountQpqStack(new App(), 'qpq-account', { qpqConfig }));
  };

  it('creates nothing unless declared', () => {
    synthReceiving(false).resourceCountIs('AWS::SES::ReceiptRuleSet', 0);
  });

  it('creates the fixed-name rule set and activates it through an SDK call', () => {
    const template = synthReceiving(true);

    template.hasResourceProperties('AWS::SES::ReceiptRuleSet', { RuleSetName: QPQ_EMAIL_RECEIPT_RULE_SET_NAME });
    template.hasResourceProperties('Custom::AWS', {
      Create: Match.serializedJson(
        Match.objectLike({ service: 'SES', action: 'setActiveReceiptRuleSet', parameters: { RuleSetName: QPQ_EMAIL_RECEIPT_RULE_SET_NAME } }),
      ),
      Delete: Match.serializedJson(Match.objectLike({ action: 'setActiveReceiptRuleSet', parameters: {} })),
    });
  });
});
