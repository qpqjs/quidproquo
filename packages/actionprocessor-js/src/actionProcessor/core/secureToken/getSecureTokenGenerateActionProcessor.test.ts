import { askSecureTokenGenerate, buildTestQpqConfig, isErroredActionResult, resolveActionResult, resolveActionResultError, SecureTokenActionType } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSecureTokenGenerateActionProcessor } from './getSecureTokenGenerateActionProcessor';

const getProcessor = async () =>
  (await getSecureTokenGenerateActionProcessor(buildTestQpqConfig(), async () => null))[SecureTokenActionType.Generate] as (
    p: any,
    ...rest: any[]
  ) => Promise<any>;

describe('getSecureTokenGenerateActionProcessor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns exactly twice the byte length in lowercase hex', async () => {
    const processor = await getProcessor();

    const token = resolveActionResult(await processor({ byteLength: 32 }, undefined as any));

    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('encodes the random bytes as hex, two characters each', async () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((array: Uint8Array) => {
      array.set([0, 15, 16, 255]);
      return array;
    }) as any);
    const processor = await getProcessor();

    expect(resolveActionResult(await processor({ byteLength: 4 }, undefined as any))).toBe('000f10ff');
  });

  it('gives a different token each time', async () => {
    const processor = await getProcessor();

    const tokens = new Set(await Promise.all([1, 2, 3].map(async () => resolveActionResult(await processor({ byteLength: 32 }, undefined as any)))));

    expect(tokens.size).toBe(3);
  });

  it.each([0, -1, 1.5, 1025, Number.NaN])('refuses a byte length of %s', async (byteLength) => {
    const processor = await getProcessor();

    const result = await processor({ byteLength }, undefined as any);

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(askSecureTokenGenerate.errorType.InvalidByteLength);
  });
});
