import { ConcurrencyGate } from './ConcurrencyGate';

/** A gate that lets `limit` pieces of work run at once and queues the rest in arrival order. */
export const createConcurrencyGate = (limit: number): ConcurrencyGate => {
  let active = 0;
  const waiting: Array<() => void> = [];

  const release = () => {
    active -= 1;
    const next = waiting.shift();
    if (next) {
      next();
    }
  };

  const acquire = (): Promise<void> => {
    if (active < limit) {
      active += 1;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      waiting.push(() => {
        active += 1;
        resolve();
      });
    });
  };

  return {
    run: async (work) => {
      await acquire();
      try {
        return await work();
      } finally {
        release();
      }
    },
  };
};
