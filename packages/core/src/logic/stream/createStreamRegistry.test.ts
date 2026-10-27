import { describe, expect, it } from 'vitest';

import { createStreamRegistry } from './createStreamRegistry';

async function* fromArray(items: string[]): AsyncIterableIterator<string> {
  for (const item of items) {
    yield item;
  }
}

describe('createStreamRegistry', () => {
  it('reads chunks in order then reports done when exhausted', async () => {
    const registry = createStreamRegistry();
    registry.register('s', fromArray(['a', 'b']));

    expect(await registry.read('s')).toEqual({ done: false, data: 'a' });
    expect(await registry.read('s')).toEqual({ done: false, data: 'b' });
    expect(await registry.read('s')).toEqual({ done: true });
  });

  it('throws when registering the same id twice', () => {
    const registry = createStreamRegistry();
    registry.register('dup', fromArray(['x']));

    expect(() => registry.register('dup', fromArray(['y']))).toThrow('Stream already registered: dup');
  });

  it('throws when reading a missing id', async () => {
    const registry = createStreamRegistry();

    await expect(registry.read('nope')).rejects.toThrow('Stream not found: nope');
  });

  it('reflects registration via has and clears it on close', () => {
    const registry = createStreamRegistry();
    expect(registry.has('s')).toBe(false);

    registry.register('s', fromArray(['a']));
    expect(registry.has('s')).toBe(true);

    registry.close('s');
    expect(registry.has('s')).toBe(false);
  });

  it('marks the stream done after exhaustion clears it from the registry', async () => {
    const registry = createStreamRegistry();
    registry.register('s', fromArray(['only']));

    await registry.read('s');
    expect(await registry.read('s')).toEqual({ done: true });
    expect(registry.has('s')).toBe(false);
  });

  it('rejects a blocking read and drops the stream when the iterator throws', async () => {
    async function* failing(): AsyncIterableIterator<string> {
      throw new Error('stream blew up');
    }

    const registry = createStreamRegistry();
    registry.register('bad', failing());

    await expect(registry.read('bad')).rejects.toThrow('stream blew up');
    expect(registry.has('bad')).toBe(false);
  });

  it('surfaces an iterator failure through noWait once it settles, instead of skipping forever', async () => {
    let reject!: (error: Error) => void;
    const gate = new Promise<string>((_, rej) => {
      reject = rej;
    });

    async function* gatedFailing(): AsyncIterableIterator<string> {
      yield await gate;
    }

    const registry = createStreamRegistry();
    registry.register('bad', gatedFailing());

    expect(await registry.read('bad', true)).toEqual({ done: false, skipped: true });

    reject(new Error('stream blew up'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    await expect(registry.read('bad', true)).rejects.toThrow('stream blew up');
    expect(registry.has('bad')).toBe(false);
  });

  it('does not throw when closing a stream whose cleanup fails', async () => {
    async function* source(): AsyncIterableIterator<string> {
      try {
        yield await new Promise<string>(() => {});
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        throw new Error('cleanup failed');
      }
    }

    const registry = createStreamRegistry();
    registry.register('s', source());

    // Let the first next() start so return() actually runs the finally block.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(() => registry.close('s')).not.toThrow();
    expect(registry.has('s')).toBe(false);

    // Give the swallowed cleanup rejection a tick so it would surface if unhandled.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('skips with noWait when the next chunk is not ready, then returns it once it is', async () => {
    let release!: (value: string) => void;
    const gate = new Promise<string>((resolve) => {
      release = resolve;
    });

    async function* gated(): AsyncIterableIterator<string> {
      yield await gate;
      yield 'second';
    }

    const registry = createStreamRegistry();
    registry.register('g', gated());

    expect(await registry.read('g', true)).toEqual({ done: false, skipped: true });

    release('first');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(await registry.read('g', true)).toEqual({ done: false, data: 'first' });
  });
});
