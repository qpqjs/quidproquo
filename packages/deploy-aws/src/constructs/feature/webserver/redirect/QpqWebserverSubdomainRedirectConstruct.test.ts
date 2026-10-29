import { defineAwsServiceAccountInfo, defineWafProtection } from '@qpqjs/config-aws';
import { QPQConfig } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';
import { defineDns, defineSubdomainRedirect, qpqWebServerUtils } from '@qpqjs/webserver';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';

import { QpqWebserverSubdomainRedirectConstruct } from './QpqWebserverSubdomainRedirectConstruct';

// The log extension layer is produced by the aws package build; a synth in a unit test only needs a directory to package.
const extensionLayer = vi.hoisted(() => ({ path: '' }));
vi.mock('@qpqjs/actionprocessor-aws', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@qpqjs/actionprocessor-aws')>()),
  getLogExtensionLayerPath: () => extensionLayer.path,
}));

// Code.fromAsset needs the bundle folder to exist, so the config roots at a scratch build dir.
const configRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-redirect-synth-'));
fs.mkdirSync(path.join(configRoot, 'build', 'apiGatewayEventHandler_redirect'), { recursive: true });
extensionLayer.path = path.join(configRoot, 'extension-layer');
fs.mkdirSync(extensionLayer.path);

const synth = (extra: QPQConfig = []) => {
  const qpqConfig = buildTestQpqConfig(
    [
      defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
      defineDns(['example.com']),
      defineSubdomainRedirect('www', './build', 'example.com'),
      ...extra,
    ],
    { configRoot },
  );
  const stack = new Stack(new App(), 'api', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new QpqWebserverSubdomainRedirectConstruct(stack, 'redirect', {
    qpqConfig,
    subdomainRedirectConfig: qpqWebServerUtils.getSubdomainRedirects(qpqConfig)[0],
  });

  return Template.fromStack(stack);
};

// Security regression: the redirect api is an http entry point like any service api, so it sits behind the same
// regional web acl when waf protection is on, and its stage never traces request and response bodies into the logs.
describe('QpqWebserverSubdomainRedirectConstruct', () => {
  it('associates the regional web acl with the redirect stage when waf protection is on', () => {
    const template = synth([defineWafProtection()]);

    template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
      ResourceArn: Match.objectLike({ 'Fn::Join': Match.anyValue() }),
      WebACLArn: Match.anyValue(),
    });
  });

  it('adds no association when waf protection is off', () => {
    synth().resourceCountIs('AWS::WAFv2::WebACLAssociation', 0);
  });

  it('never traces request bodies on the redirect stage', () => {
    const stages = Object.values(synth().findResources('AWS::ApiGateway::Stage'));

    expect(stages).toHaveLength(1);
    for (const method of (stages[0] as any).Properties.MethodSettings ?? []) {
      expect(method.DataTraceEnabled).not.toBe(true);
    }
  });

  it('passes the redirect target to the lambda as plain env values', () => {
    synth().hasResourceProperties('AWS::Lambda::Function', {
      Environment: { Variables: Match.objectLike({ redirectBaseUrl: 'https://development.example.com', appendPath: 'true' }) },
    });
  });
});
