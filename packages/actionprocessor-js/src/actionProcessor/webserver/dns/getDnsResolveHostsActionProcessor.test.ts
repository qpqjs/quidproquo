import { buildTestQpqConfig, resolveActionResult } from 'quidproquo-core';
import { defineApi, defineDns, DnsActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { getDnsResolveHostsActionProcessor } from './getDnsResolveHostsActionProcessor';

const getProcessor = async (qpqConfig = buildTestQpqConfig()) =>
  (await getDnsResolveHostsActionProcessor(qpqConfig, async () => null))[DnsActionType.ResolveHosts] as (p: any, ...rest: any[]) => Promise<any>;

describe('getDnsResolveHostsActionProcessor', () => {
  it('resolves the target on every root', async () => {
    const processor = await getProcessor(buildTestQpqConfig([defineDns(['example.com', 'example.org']), defineApi('api')]));

    expect(resolveActionResult(await processor({ subdomain: 'api' }, undefined as any))).toEqual([
      'api.development.example.com',
      'api.development.example.org',
    ]);
  });

  it('returns an empty list when no dns is configured', async () => {
    const processor = await getProcessor();

    expect(resolveActionResult(await processor({}, undefined as any))).toEqual([]);
  });
});
