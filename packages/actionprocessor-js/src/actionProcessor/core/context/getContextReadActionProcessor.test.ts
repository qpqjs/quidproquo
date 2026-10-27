import { buildTestQpqConfig, buildTestStorySession, ContextActionType, QpqContextIdentifier, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getContextReadActionProcessor } from './getContextReadActionProcessor';

const makeIdentifier = (overrides: Partial<QpqContextIdentifier<any>> = {}): QpqContextIdentifier<any> => ({
  uniqueName: 'tenant',
  defaultValue: 'default-tenant',
  local: false,
  ...overrides,
});

describe('getContextReadActionProcessor', () => {
  const resolve = async () =>
    (await getContextReadActionProcessor(buildTestQpqConfig(), async () => null))[ContextActionType.Read] as (p: any, ...rest: any[]) => Promise<any>;

  it('reads a value from the shared context', async () => {
    const processor = await resolve();

    const result = await processor({ contextIdentifier: makeIdentifier() }, buildTestStorySession({ context: { tenant: 'acme' } }));

    expect(resolveActionResult(result)).toBe('acme');
  });

  it('falls back to the default value when the key is absent', async () => {
    const processor = await resolve();

    const result = await processor({ contextIdentifier: makeIdentifier() }, buildTestStorySession({ context: {} }));

    expect(resolveActionResult(result)).toBe('default-tenant');
  });

  it('reads from the local context when the identifier is local', async () => {
    const processor = await resolve();

    const result = await processor(
      { contextIdentifier: makeIdentifier({ local: true }) },
      buildTestStorySession({ context: { tenant: 'shared' }, localContext: { tenant: 'local' } }),
    );

    expect(resolveActionResult(result)).toBe('local');
  });

  it('defaults to the identifier default when the local context is missing entirely', async () => {
    const processor = await resolve();

    const result = await processor({ contextIdentifier: makeIdentifier({ local: true }) }, buildTestStorySession({ context: {} }));

    expect(resolveActionResult(result)).toBe('default-tenant');
  });
});
