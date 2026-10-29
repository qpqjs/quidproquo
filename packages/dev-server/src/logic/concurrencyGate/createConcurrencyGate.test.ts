import { describe, expect, it } from 'vitest';

import { createConcurrencyGate } from './createConcurrencyGate';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe('createConcurrencyGate', () => {
  it('runs at most the limit at once and starts the rest in order as slots free up', async () => {
    const gate = createConcurrencyGate(1);
    const started: string[] = [];
    const first = deferred();
    const second = deferred();

    const a = gate.run(async () => {
      started.push('a');
      await first.promise;
    });
    const b = gate.run(async () => {
      started.push('b');
      await second.promise;
    });

    await Promise.resolve();
    expect(started).toEqual(['a']);

    first.resolve();
    await a;
    await Promise.resolve();
    expect(started).toEqual(['a', 'b']);

    second.resolve();
    await b;
  });

  it('frees the slot when the work throws', async () => {
    const gate = createConcurrencyGate(1);

    await expect(gate.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(gate.run(async () => 'ran')).resolves.toBe('ran');
  });

  it('allows the limit to run in parallel', async () => {
    const gate = createConcurrencyGate(2);
    const started: number[] = [];
    const hold = deferred();

    const runs = [1, 2, 3].map((n) =>
      gate.run(async () => {
        started.push(n);
        await hold.promise;
      }),
    );

    await Promise.resolve();
    expect(started).toEqual([1, 2]);

    hold.resolve();
    await Promise.all(runs);
    expect(started).toEqual([1, 2, 3]);
  });
});
