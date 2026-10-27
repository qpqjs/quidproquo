import { buildTestQpqConfig, resolveActionResult } from 'quidproquo-core';
import { defineDns, DnsActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { getDnsListActionProcessor } from './getDnsListActionProcessor';

const getProcessor = async (qpqConfig = buildTestQpqConfig()) =>
  (await getDnsListActionProcessor(qpqConfig, async () => null))[DnsActionType.List] as (p: any, ...rest: any[]) => Promise<any>;

describe('getDnsListActionProcessor', () => {
  it('returns every declared root, primary first', async () => {
    const processor = await getProcessor(buildTestQpqConfig([defineDns(['example.com', 'example.org'])]));

    expect(resolveActionResult(await processor(undefined, undefined as any))).toEqual(['example.com', 'example.org']);
  });

  it('returns an empty list when no dns is configured', async () => {
    const processor = await getProcessor();

    expect(resolveActionResult(await processor(undefined, undefined as any))).toEqual([]);
  });
});
