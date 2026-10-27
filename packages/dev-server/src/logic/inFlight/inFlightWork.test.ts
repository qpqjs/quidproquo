import { beforeEach, describe, expect, it } from 'vitest';

import { awaitDevServerIdle, trackInFlight } from './inFlightWork';

// The registry is module state and every test drains it to empty, which is the
// only reset it needs.
beforeEach(async () => {
  await awaitDevServerIdle();
});

const deferred = () => {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;

  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('awaitDevServerIdle', () => {
  it('resolves immediately when nothing is tracked', async () => {
    await expect(awaitDevServerIdle()).resolves.toBeUndefined();
  });

  it('waits for tracked work', async () => {
    const work = deferred();
    let finished = false;

    void trackInFlight(work.promise);

    const idle = awaitDevServerIdle().then(() => {
      finished = true;
    });

    // A turn of the loop is enough for a resolved promise to settle; this one
    // must not have.
    await Promise.resolve();
    expect(finished).toBe(false);

    work.resolve();
    await idle;

    expect(finished).toBe(true);
  });

  it('waits for work tracked while it is already waiting', async () => {
    // The refill case the waiter's loop exists for: a queue message enqueues
    // more work, so the set is empty for an instant and then is not.
    const first = deferred();
    const second = deferred();
    let finished = false;

    void trackInFlight(
      first.promise.then(() => {
        void trackInFlight(second.promise);
      }),
    );

    const idle = awaitDevServerIdle().then(() => {
      finished = true;
    });

    first.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(finished).toBe(false);

    second.resolve();
    await idle;

    expect(finished).toBe(true);
  });

  it('clears work that rejected', async () => {
    const work = deferred();

    // The caller handles its own failures; the registry only tracks that the
    // work is over, however it ended.
    void trackInFlight(work.promise).catch(() => undefined);

    work.reject(new Error('handler blew up'));

    await expect(awaitDevServerIdle()).resolves.toBeUndefined();
  });

  it('hands the original promise back to the caller', async () => {
    const work = Promise.resolve('result');

    await expect(trackInFlight(work)).resolves.toBe('result');
  });
});
