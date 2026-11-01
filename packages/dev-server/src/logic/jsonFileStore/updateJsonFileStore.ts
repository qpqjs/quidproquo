import { readJsonFileStore, writeJsonFileStore } from './jsonFileStore';

// One in-flight update per store file. A read-modify-write that is not serialised loses writes
// when two callers seed the same file at once (the last write wins and the other caller's value,
// or a token just signed with it, is gone), so updates to one file queue behind each other.
const updateTails: Map<string, Promise<unknown>> = new Map();

/**
 * Reads a store, applies `update` to its values and writes the result, serialised per file within
 * this process so concurrent updates never overwrite each other. Resolves to the written values.
 */
export const updateJsonFileStore = async <T>(
  runtimePath: string,
  storeDirectory: string,
  fileName: string,
  update: (values: Record<string, T>) => Record<string, T>,
): Promise<Record<string, T>> => {
  const key = `${runtimePath}/${storeDirectory}/${fileName}`;
  const previous = updateTails.get(key) ?? Promise.resolve();

  const run = previous
    .catch(() => undefined)
    .then(async () => {
      const values = await readJsonFileStore<T>(runtimePath, storeDirectory, fileName);
      const updated = update(values);

      await writeJsonFileStore(runtimePath, storeDirectory, fileName, updated);

      return updated;
    });

  updateTails.set(key, run);
  run.finally(() => {
    if (updateTails.get(key) === run) {
      updateTails.delete(key);
    }
  });

  return run;
};
