import { describe, expect, it } from 'vitest';

import { invokeProcessor } from './invokeProcessor';

describe('invokeProcessor', () => {
  it('passes the payload with inert runtime args and a default test session', async () => {
    const seen: unknown[] = [];
    const processor = async (...args: unknown[]): Promise<[string?]> => {
      seen.push(...args);
      return ['ok'];
    };

    const [result] = await invokeProcessor(processor, { id: 1 });

    expect(result).toBe('ok');
    expect(seen).toHaveLength(7);
    expect(seen[0]).toEqual({ id: 1 });
    expect(seen[1]).toHaveProperty('correlation');
    expect(typeof seen[4]).toBe('function');
    expect(typeof seen[5]).toBe('function');
  });

  it('lets a test override any runtime arg', async () => {
    const logger = { log: () => {} };
    const processor = async (_payload: unknown, _session: unknown, _processors: unknown, seenLogger: unknown): Promise<[unknown?]> => [seenLogger];

    const [result] = await invokeProcessor(processor, {}, { logger });

    expect(result).toBe(logger);
  });
});
