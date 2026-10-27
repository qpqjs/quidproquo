import { buildTestQpqConfig } from 'quidproquo-core';
import { defineDns } from 'quidproquo-webserver';

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { requireDomainResolver } from './requireDomainResolver';

const basePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-domain-resolver-'));
fs.writeFileSync(
  path.join(basePath, 'resolver.js'),
  'exports.domainResolver = { resolveHost: (scope) => `${scope.environment}-${scope.subdomain}.${scope.rootDomain}` };\nexports.notAResolver = 42;\n',
);

afterAll(() => fs.rmSync(basePath, { recursive: true, force: true }));

describe('requireDomainResolver', () => {
  it('is undefined for the default shape', () => {
    expect(requireDomainResolver(buildTestQpqConfig([defineDns('example.com')]))).toBeUndefined();
  });

  it('loads the export the Dns setting points at', () => {
    const qpqConfig = buildTestQpqConfig([
      defineDns('example.com', { resolver: { basePath, relativePath: 'resolver', functionName: 'domainResolver' } }),
    ]);

    expect(requireDomainResolver(qpqConfig)?.resolveHost({ rootDomain: 'example.com', environment: 'dev', subdomain: 'api' })).toBe(
      'dev-api.example.com',
    );
  });

  it('rejects a pointer at something that is not a resolver', () => {
    const qpqConfig = buildTestQpqConfig([
      defineDns('example.com', { resolver: { basePath, relativePath: 'resolver', functionName: 'notAResolver' } }),
    ]);

    expect(() => requireDomainResolver(qpqConfig)).toThrow('must be a DomainResolver');
  });
});
