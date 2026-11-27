import { defineAwsServiceAccountInfo, defineDomainCertificate, defineEmailSenderAllowList } from '@qpqjs/config-aws';
import { QPQConfig, QpqPureFunction } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';
import { defineApi, defineDns, defineEmailReceivingDomain, defineEmailSender, defineWebEntry, qpqWebServerUtils } from '@qpqjs/webserver';

import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { DomainQpqWebserverApiConstruct } from '../constructs/feature/webserver/api/DomainQpqWebserverApiConstruct';
import { QpqWebserverEmailSenderConstruct } from '../constructs/feature/webserver/emailSender/QpqWebserverEmailSenderConstruct';
import { convertContentSecurityPolicy } from '../constructs/feature/webserver/webEntry/utils/securityHeaders';
import { domainScopedId, resolveHostedZoneForHost } from '../utils/domain';
import { BootstrapQpqServiceStack } from './BootstrapQpqServiceStack';
import { createDomainCertificateStacks } from './createDomainCertificateStacks';
import { DomainQpqServiceStack } from './DomainQpqServiceStack';

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

const buildConfig = (roots: string | string[], extra: QPQConfig = [], resolver?: QpqPureFunction, legacyUnsuffixedRootDomain?: string): QPQConfig =>
  buildTestQpqConfig([
    defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2'),
    defineDns(roots, { resolver, legacyUnsuffixedRootDomain }),
    defineApi('api'),
    defineDomainCertificate('us-east-1', [{ subdomain: 'www' }], { includeApex: true }),
    defineDomainCertificate('ap-southeast-2', [{ subdomain: 'api' }, { subdomain: 'ws', service: 'ws' }]),
    ...extra,
  ]);

const synthApiDomain = (qpqConfig: QPQConfig) => {
  const app = new App();
  const stack = new Stack(app, 'domain', { env: { account: '123456789012', region: 'ap-southeast-2' } });
  new DomainQpqWebserverApiConstruct(stack, 'api', { qpqConfig, apiConfig: qpqWebServerUtils.getAllApiConfigs(qpqConfig)[0]! });
  return Template.fromStack(stack);
};

describe('DomainCertificateStack', () => {
  it('issues one cert per region covering every root, app-keyed in SSM', () => {
    const app = new App();
    const stacks = createDomainCertificateStacks(app, buildConfig(['example.com', 'example.org']), 'test');

    expect(stacks.map((stack) => stack.stackName)).toEqual(['test-cert', 'test-cert']);
    expect(stacks![0]!.domainNames).toEqual([
      'development.example.com',
      'development.example.org',
      'www.development.example.com',
      'www.development.example.org',
    ]);

    const template = Template.fromStack(stacks![1]!);
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

    expect(stacks![1]!.domainNames).toEqual(['development-api.example.com', 'development-ws-ws.example.com']);
  });

  it('fails synth above the ACM name quota', () => {
    const roots = ['a.com', 'b.com', 'c.com', 'd.com', 'e.com', 'f.com'];
    expect(() => createDomainCertificateStacks(new App(), buildConfig(roots), 'test')).toThrow('ACM allows 10');
  });
});

describe('DomainQpqWebserverApiConstruct', () => {
  it("names every root's resources after the root", () => {
    const template = synthApiDomain(buildConfig(['example.com', 'example.org']));

    template.resourceCountIs('AWS::ApiGateway::DomainName', 2);
    template.resourceCountIs('AWS::Route53::RecordSet', 2);
    const ids = Object.keys(template.findResources('AWS::ApiGateway::DomainName'));
    expect(ids.some((id) => id.startsWith('apisubdomainexamplecomdomainname'))).toBe(true);
    expect(ids.some((id) => id.startsWith('apisubdomainexampleorgdomainname'))).toBe(true);
  });

  it('names a single root after the root too', () => {
    const template = synthApiDomain(buildConfig('example.com'));

    template.resourceCountIs('AWS::ApiGateway::DomainName', 1);
    template.hasResourceProperties('AWS::ApiGateway::DomainName', { DomainName: 'api.development.example.com' });
    expect(Object.keys(template.findResources('AWS::ApiGateway::DomainName'))[0]).toMatch(/^apisubdomainexamplecomdomainname/);
  });

  it('keeps the unsuffixed logical ids of a legacy root, wherever it sits in the list', () => {
    const template = synthApiDomain(buildConfig(['example.org', 'example.com'], [], undefined, 'example.com'));

    const domainNames = template.findResources('AWS::ApiGateway::DomainName');
    const idOf = (host: string) => Object.keys(domainNames).find((id) => domainNames[id]!.Properties.DomainName === host);

    expect(idOf('api.development.example.com')).toMatch(/^apisubdomaindomainname/);
    expect(idOf('api.development.example.org')).toMatch(/^apisubdomainexampleorgdomainname/);
  });

  it('follows a custom resolver, placing sibling hosts in the root zone', () => {
    const qpqConfig = buildConfig('example.com', [], hyphenatedPointer);
    const template = synthApiDomain(qpqConfig);

    template.hasResourceProperties('AWS::ApiGateway::DomainName', { DomainName: 'development-api.example.com' });
    expect(resolveHostedZoneForHost(qpqConfig, 'development-api.example.com')).toBe('example.com');
  });
});

describe('DomainQpqServiceStack', () => {
  it('creates the api gateway service-linked role first and makes every api domain wait for it', () => {
    const template = Template.fromStack(new DomainQpqServiceStack(new App(), 'test-domain', { qpqConfig: buildConfig('example.com') }));

    template.hasResourceProperties('Custom::AWS', {
      Create: Match.serializedJson(
        Match.objectLike({
          service: 'IAM',
          action: 'createServiceLinkedRole',
          parameters: { AWSServiceName: 'ops.apigateway.amazonaws.com' },
          ignoreErrorCodesMatching: 'InvalidInput',
        }),
      ),
    });

    const [customResourceId] = Object.keys(template.findResources('Custom::AWS'));
    template.hasResource('AWS::ApiGateway::DomainName', { DependsOn: Match.arrayWith([customResourceId]) });
  });
});

describe('domain helpers', () => {
  it('zones a host under its site root, else under the root, and rejects unknown hosts', () => {
    const qpqConfig = buildConfig(['example.com', 'example.org']);

    expect(resolveHostedZoneForHost(qpqConfig, 'ws.ws.development.example.org')).toBe('development.example.org');
    expect(resolveHostedZoneForHost(qpqConfig, 'development.example.org')).toBe('development.example.org');
    expect(() => resolveHostedZoneForHost(qpqConfig, 'api.other.com')).toThrow('no declared root');
  });

  it('scopes construct ids by root, whatever the order', () => {
    const qpqConfig = buildConfig(['example.com', 'example.org']);

    expect(domainScopedId(qpqConfig, 'bpm', 'example.com')).toBe('bpm-example-com');
    expect(domainScopedId(qpqConfig, 'bpm', 'example.org')).toBe('bpm-example-org');
  });

  it('keeps the bare construct id for the legacy unsuffixed root only', () => {
    const qpqConfig = buildConfig(['example.org', 'example.com'], [], undefined, 'example.com');

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

// A resource whose physical name is a host or address cannot exist twice, and CloudFormation
// creates before it deletes. So across any change to the root list, a name must stay under the
// logical id it already has: it may appear or disappear, never move.
describe("changing an app's root domains", () => {
  const env = { account: '123456789012', region: 'ap-southeast-2' };

  /** Every named resource the root list shapes, as `type|name` to its logical id. */
  const synthNamedResources = (roots: string[], legacyUnsuffixedRootDomain?: string): Record<string, string> => {
    const qpqConfig = buildConfig(
      roots,
      [defineEmailReceivingDomain(), defineEmailSender(), defineEmailSenderAllowList(['someone@example.net'])],
      undefined,
      legacyUnsuffixedRootDomain,
    );

    const app = new App();
    const serviceStack = new Stack(app, 'service', { env });
    new DomainQpqWebserverApiConstruct(serviceStack, 'api', { qpqConfig, apiConfig: qpqWebServerUtils.getAllApiConfigs(qpqConfig)[0]! });
    new QpqWebserverEmailSenderConstruct(serviceStack, QpqWebserverEmailSenderConstruct.getConstructId(qpqConfig), {
      qpqConfig,
      emailSenderConfig: qpqWebServerUtils.getEmailSenderConfig(qpqConfig)!,
    });
    const bootstrapStack = new BootstrapQpqServiceStack(app, 'bootstrap', { qpqConfig, env } as any);

    const named: Record<string, string> = {};
    for (const stack of [serviceStack, bootstrapStack]) {
      const resources = Template.fromStack(stack).toJSON().Resources as Record<string, { Type: string; Properties?: Record<string, unknown> }>;

      for (const [logicalId, resource] of Object.entries(resources)) {
        const properties = resource.Properties ?? {};
        const name = [properties.DomainName, properties.EmailIdentity, properties.Name].find((value) => typeof value === 'string');
        const isRootShaped = typeof name === 'string' && /example\.(com|org|net)/.test(name);

        if (isRootShaped) {
          named[`${stack.stackName}|${resource.Type}|${properties.Type ?? ''}|${name}`] = logicalId;
        }
      }
    }

    return named;
  };

  /** Fails when a name sits under one logical id in one deploy and another in the next. */
  const expectNoNameMoves = (steps: Record<string, string>[]) => {
    const seen: Record<string, string> = {};

    for (const step of steps) {
      for (const [name, logicalId] of Object.entries(step)) {
        expect(`${name} => ${logicalId}`).toBe(`${name} => ${seen[name] ?? logicalId}`);
        seen[name] = logicalId;
      }
    }
  };

  it('covers the api domain, its record, and the sending and receiving identities and records', () => {
    const names = Object.keys(synthNamedResources(['example.com']));

    expect(names).toEqual(
      expect.arrayContaining([
        'service|AWS::ApiGateway::DomainName||api.development.example.com',
        'service|AWS::Route53::RecordSet|A|api.development.example.com.',
        'service|AWS::SES::EmailIdentity||development.example.com',
        'service|AWS::SES::EmailIdentity||someone@example.net',
        'bootstrap|AWS::SES::EmailIdentity||inbox.development.example.com',
        'bootstrap|AWS::Route53::RecordSet|MX|inbox.development.example.com.',
      ]),
    );
  });

  it('never moves a name when roots are added, reordered or removed', () => {
    expectNoNameMoves([
      synthNamedResources(['example.com']),
      synthNamedResources(['example.com', 'example.org']),
      synthNamedResources(['example.org', 'example.com']),
      synthNamedResources(['example.org']),
    ]);
  });

  it('never moves a name of an app first deployed with unsuffixed names', () => {
    const legacy = 'example.com';
    const asFirstDeployed = synthNamedResources(['example.com'], legacy);

    // The names the app was first deployed under: nothing carries the root.
    expect(asFirstDeployed['service|AWS::ApiGateway::DomainName||api.development.example.com']).toMatch(/^apisubdomaindomainname/);
    expect(asFirstDeployed['service|AWS::SES::EmailIdentity||development.example.com']).toMatch(/^EmailSenderexamplecomidentity/);
    expect(asFirstDeployed['service|AWS::SES::EmailIdentity||someone@example.net']).toMatch(/^EmailSenderexamplecomAllowListIdentity/);

    expectNoNameMoves([
      asFirstDeployed,
      synthNamedResources(['example.org', 'example.com'], legacy),
      synthNamedResources(['example.com', 'example.org'], legacy),
      synthNamedResources(['example.org'], legacy),
    ]);
  });

  it('keeps the api domain of such an app when the setting is dropped after its root, but not the sender identities, which need the setting kept', () => {
    const withSetting = synthNamedResources(['example.org'], 'example.com');
    const withoutSetting = synthNamedResources(['example.org']);
    const apiDomain = 'service|AWS::ApiGateway::DomainName||api.development.example.org';
    const senderIdentity = 'service|AWS::SES::EmailIdentity||development.example.org';

    expect(withoutSetting[apiDomain]).toBe(withSetting[apiDomain]);
    expect(withoutSetting[senderIdentity]).not.toBe(withSetting[senderIdentity]);
  });
});
