import { defineAwsServiceAccountInfo, defineDomainCertificate } from 'quidproquo-config-aws';
import { buildTestQpqConfig, QPQConfig } from 'quidproquo-core';
import { defineApi, defineDns, defineWebEntry, qpqWebServerUtils } from 'quidproquo-webserver';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { DomainQpqWebserverApiConstruct } from '../constructs/feature/webserver/api/DomainQpqWebserverApiConstruct';
import { convertContentSecurityPolicy } from '../constructs/feature/webserver/webEntry/utils/securityHeaders';
import { domainScopedId, resolveHostedZoneForHost } from '../utils/domain';
import { createDomainCertificateStacks } from './createDomainCertificateStacks';

// The hyphenated resolver as a pointer the config can carry, written where ts-node
// would find an app's own.
const resolverDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-domain-synth-'));
fs.writeFileSync(
  path.join(resolverDir, 'resolver.js'),
  `exports.hyphenated = {
    resolveHost: ({ rootDomain, environment, subdomain, service }) => {
      const label = [environment === 'production' ? undefined : environment, subdomain, service].filter(Boolean).join('-');
      return label ? label + '.' + rootDomain : rootDomain;
    },
  };`,
);
const hyphenatedPointer = { basePath: resolverDir, relativePath: 'resolver', functionName: 'hyphenated' };

afterAll(() => fs.rmSync(resolverDir, { recursive: true, force: true }));

const buildConfig = (roots: string | string[], extra: QPQConfig = [], resolver?: QpqPureFunction): QPQConfig =>
  buildTestQpqConfig([
    defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
    defineDns(roots, { resolver }),
    defineApi('api'),
    defineDomainCertificate('us-east-1', [{ subdomain: 'www' }], { includeApex: true }),
    defineDomainCertificate('ap-southeast-2', [{ subdomain: 'api' }, { subdomain: 'ws', service: 'ws' }]),
    ...extra,
  ]);

const synthApiDomain = (qpqConfig: QPQConfig) => {
  const app = new App();
  const stack = new Stack(app, 'domain', { env: { account: '123456789012', region: 'ap-southeast-2' } });
  new DomainQpqWebserverApiConstruct(stack, 'api', { qpqConfig, apiConfig: qpqWebServerUtils.getApiConfigs(qpqConfig)[0] });
  return Template.fromStack(stack);
};

describe('DomainCertificateStack', () => {
  it('issues one cert per region covering every root, app-keyed in SSM', () => {
    const app = new App();
    const stacks = createDomainCertificateStacks(app, buildConfig(['example.com', 'example.org']), 'test');

    expect(stacks.map((stack) => stack.stackName)).toEqual(['test-cert', 'test-cert']);
    expect(stacks[0].domainNames).toEqual([
      'development.example.com',
      'development.example.org',
      'www.development.example.com',
      'www.development.example.org',
    ]);

    const template = Template.fromStack(stacks[1]);
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'api.development.example.com',
      SubjectAlternativeNames: ['api.development.example.org', 'ws.ws.development.example.com', 'ws.ws.development.example.org'],
    });
    template.hasResource('AWS::CertificateManager::Certificate', { DeletionPolicy: 'Retain' });
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      Tags: Match.arrayWith([
        { Key: 'application', Value: 'test-app' },
        { Key: 'environment', Value: 'development' },
      ]),
    });
    template.hasResourceProperties('AWS::SSM::Parameter', { Name: '/qpq/domain/certificate-arn/ap-southeast-2/test-app-development' });
  });

  it('resolves certificate names with the resolver the config points at', () => {
    const stacks = createDomainCertificateStacks(new App(), buildConfig('example.com', [], hyphenatedPointer), 'test');

    expect(stacks[1].domainNames).toEqual(['development-api.example.com', 'development-ws-ws.example.com']);
  });

  it('fails synth above the ACM name quota', () => {
    const roots = ['a.com', 'b.com', 'c.com', 'd.com', 'e.com', 'f.com'];
    expect(() => createDomainCertificateStacks(new App(), buildConfig(roots), 'test')).toThrow('ACM allows 10');
  });
});

describe('DomainQpqWebserverApiConstruct', () => {
  it('keeps legacy logical ids for a single root', () => {
    const template = synthApiDomain(buildConfig('example.com'));

    template.resourceCountIs('AWS::ApiGateway::DomainName', 1);
    template.hasResourceProperties('AWS::ApiGateway::DomainName', { DomainName: 'api.development.example.com' });
    expect(Object.keys(template.findResources('AWS::ApiGateway::DomainName'))[0]).toMatch(/^apisubdomaindomainname/);
  });

  it('adds suffixed resources for every extra root', () => {
    const template = synthApiDomain(buildConfig(['example.com', 'example.org']));

    template.resourceCountIs('AWS::ApiGateway::DomainName', 2);
    template.resourceCountIs('AWS::Route53::RecordSet', 2);
    const ids = Object.keys(template.findResources('AWS::ApiGateway::DomainName'));
    expect(ids.some((id) => id.startsWith('apisubdomaindomainname'))).toBe(true);
    expect(ids.some((id) => id.startsWith('apisubdomainexampleorgdomainname'))).toBe(true);
  });

  it('follows a custom resolver, placing sibling hosts in the root zone', () => {
    const qpqConfig = buildConfig('example.com', [], hyphenatedPointer);
    const template = synthApiDomain(qpqConfig);

    template.hasResourceProperties('AWS::ApiGateway::DomainName', { DomainName: 'development-api.example.com' });
    expect(resolveHostedZoneForHost(qpqConfig, 'development-api.example.com')).toBe('example.com');
  });
});

describe('domain helpers', () => {
  it('zones a host under its site root, else under the root, and rejects unknown hosts', () => {
    const qpqConfig = buildConfig(['example.com', 'example.org']);

    expect(resolveHostedZoneForHost(qpqConfig, 'ws.ws.development.example.org')).toBe('development.example.org');
    expect(resolveHostedZoneForHost(qpqConfig, 'development.example.org')).toBe('development.example.org');
    expect(() => resolveHostedZoneForHost(qpqConfig, 'api.other.com')).toThrow('no declared root');
  });

  it('scopes construct ids by root, primary bare', () => {
    const qpqConfig = buildConfig(['example.com', 'example.org']);

    expect(domainScopedId(qpqConfig, 'bpm', 'example.com')).toBe('bpm');
    expect(domainScopedId(qpqConfig, 'bpm', 'example.org')).toBe('bpm-example-org');
  });

  it('expands CSP service entries per root', () => {
    // Declared on the web entry so the entries are materialised, as in a real config.
    const contentSecurityPolicy = {
      override: true,
      contentSecurityPolicy: { 'connect-src': ["'self'", { api: 'api' }, { api: 'ws', service: 'ws', protocol: 'wss' as const }] },
    };
    const qpqConfig = buildConfig(
      ['example.com', 'example.org'],
      [defineWebEntry('site', { domain: { onRootDomain: true }, securityHeaders: { contentSecurityPolicy } })],
    );

    const policy = convertContentSecurityPolicy(qpqConfig, contentSecurityPolicy);

    expect(policy?.contentSecurityPolicy).toContain(
      "connect-src 'self' api.development.example.com api.development.example.org wss://ws.ws.development.example.com wss://ws.ws.development.example.org",
    );
  });
});
