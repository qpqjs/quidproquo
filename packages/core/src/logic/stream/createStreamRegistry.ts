import { StreamChunk, StreamRegistry } from '../../types/StreamRegistry';

interface StreamEntry {
  iterator: AsyncIterableIterator<string>;
  nextPromise: Promise<IteratorResult<string>>;
  settled: boolean;
  settledResult?: IteratorResult<string>;
  settledError?: unknown;
}

export const createStreamRegistry = (): StreamRegistry => {
  const streams = new Map<string, StreamEntry>();

  // Pull the next value and remember when it settles, so noWait can tell synchronously
  // whether a chunk is ready without racing an already-resolved sentinel (which would
  // always win and make noWait report "skipped" forever).
  const advance = (entry: StreamEntry): void => {
    const next = entry.iterator.next();
    entry.nextPromise = next;
    entry.settled = false;
    entry.settledResult = undefined;
    entry.settledError = undefined;

    // Track fulfilment for noWait reads.
    const rememberResult = (result: IteratorResult<string>): void => {
      if (entry.nextPromise === next) {
        entry.settled = true;
        entry.settledResult = result;
      }
    };

    // Track rejection too: without this a failing iterator leaves an unhandled
    // rejection and noWait reads would report "skipped" forever.
    const rememberError = (error: unknown): void => {
      if (entry.nextPromise === next) {
        entry.settled = true;
        entry.settledError = error;
      }
    };

    next.then(rememberResult, rememberError);
  };

  return {
    register(id: string, iterator: AsyncIterableIterator<string>): void {
      if (streams.has(id)) {
        throw new Error(`Stream already registered: ${id}`);
      }

      const entry: StreamEntry = { iterator, nextPromise: Promise.resolve() as any, settled: false };
      streams.set(id, entry);
      advance(entry);
    },

    async read(id: string, noWait?: boolean): Promise<StreamChunk<string>> {
      const entry = streams.get(id);
      if (!entry) {
        throw new Error(`Stream not found: ${id}`);
      }

      if (noWait) {
        // Give an already-resolvable promise a microtask to flip the settled flag.
        await Promise.resolve();

        if (!entry.settled) {
          return { done: false, skipped: true };
        }

        // A settled entry with no result means the iterator rejected.
        if (!entry.settledResult) {
          streams.delete(id);
          throw entry.settledError;
        }

        const iterResult = entry.settledResult;
        if (iterResult.done) {
          streams.delete(id);
          return { done: true };
        }

        advance(entry);
        return { done: false, data: iterResult.value };
      }

      let iterResult: IteratorResult<string>;
      try {
        iterResult = await entry.nextPromise;
      } catch (error) {
        // A failed stream cannot yield anything more, drop it so callers do not
        // keep re-reading a dead entry.
        streams.delete(id);
        throw error;
      }

      if (iterResult.done) {
        streams.delete(id);
        return { done: true };
      }

      advance(entry);
      return { done: false, data: iterResult.value };
    },

    close(id: string): void {
      const entry = streams.get(id);
      if (entry) {
        // Swallow cleanup failures so close never surfaces as an unhandled rejection.
        entry.iterator.return?.()?.catch(() => {});
        streams.delete(id);
      }
    },

    has(id: string): boolean {
      return streams.has(id);
    },
  };
};
