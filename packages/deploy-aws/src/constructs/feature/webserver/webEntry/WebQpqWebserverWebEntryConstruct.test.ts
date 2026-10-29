import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { defineStorageDrive, QPQConfig } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';
import { defineDns, defineWebEntry, QPQConfigAdvancedWebEntrySettings, qpqWebServerUtils } from '@qpqjs/webserver';

import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';

import { WebQpqWebserverWebEntryConstruct } from './WebQpqWebserverWebEntryConstruct';

// Served from an existing drive so no build directory has to exist for the asset upload.
const baseOptions: QPQConfigAdvancedWebEntrySettings = {
  domain: { onRootDomain: true },
  storageDrive: { sourceStorageDrive: 'website', autoUpload: false },
};

const synth = (options: Partial<QPQConfigAdvancedWebEntrySettings> = {}) => {
  const qpqConfig: QPQConfig = buildTestQpqConfig([
    defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
    defineDns(['example.com']),
    defineStorageDrive('website'),
    defineWebEntry('site', { ...baseOptions, ...options }),
  ]);
  const stack = new Stack(new App(), 'web', { env: { account: '123456789012', region: 'ap-southeast-2' } });

  new WebQpqWebserverWebEntryConstruct(stack, 'entry', { qpqConfig, webEntryConfig: qpqWebServerUtils.getWebEntryConfigs(qpqConfig)[0] });

  return Template.fromStack(stack);
};

const securityHeadersConfig = (template: Template) => {
  const policies = Object.values(template.findResources('AWS::CloudFront::ResponseHeadersPolicy'));
  expect(policies).toHaveLength(1);
  return (policies[0] as any).Properties.ResponseHeadersPolicyConfig.SecurityHeadersConfig;
};

// Security regression: every web entry answers with the baseline browser hardening headers whether or not the app
// configured any, while a content security policy (which needs the app's own host list) is added only when configured.
describe('WebQpqWebserverWebEntryConstruct security headers', () => {
  it('always sends hsts, nosniff, frame deny and a referrer policy, with no csp unless configured', () => {
    const config = securityHeadersConfig(synth());

    expect(config.StrictTransportSecurity).toMatchObject({ Override: true, IncludeSubdomains: true, Preload: true });
    expect(config.ContentTypeOptions).toEqual({ Override: true });
    expect(config.FrameOptions).toEqual({ FrameOption: 'DENY', Override: true });
    expect(config.ReferrerPolicy).toEqual({ ReferrerPolicy: 'strict-origin-when-cross-origin', Override: true });
    expect(config.ContentSecurityPolicy).toBeUndefined();
  });

  it('attaches the policy to the default behaviour and every ignore-cache behaviour', () => {
    const template = synth({ ignoreCache: ['index.html', 'remoteEntry.js'] });
    const [distribution] = Object.values(template.findResources('AWS::CloudFront::Distribution')) as any[];
    const behaviours = [
      distribution.Properties.DistributionConfig.DefaultCacheBehavior,
      ...distribution.Properties.DistributionConfig.CacheBehaviors,
    ];

    expect(behaviours).toHaveLength(3);
    for (const behaviour of behaviours) {
      expect(behaviour.ResponseHeadersPolicyId).toBeDefined();
    }
  });

  it('adds the csp when security headers are configured', () => {
    const config = securityHeadersConfig(
      synth({ securityHeaders: { contentSecurityPolicy: { override: true, contentSecurityPolicy: { 'default-src': ["'self'"] } } } }),
    );

    expect(config.ContentSecurityPolicy.ContentSecurityPolicy).toContain("default-src 'self'");
  });
});
