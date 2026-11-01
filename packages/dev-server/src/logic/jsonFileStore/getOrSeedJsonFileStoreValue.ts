import { updateJsonFileStore } from './updateJsonFileStore';

/**
 * The value under `key` in a store file, seeding it with `buildSeedValue()` on first use. Runs inside the
 * file's serialised update, so concurrent first uses of one key all receive the same seeded value and two
 * keys seeding into one file at once both land.
 */
export const getOrSeedJsonFileStoreValue = async <T>(
  runtimePath: string,
  storeDirectory: string,
  fileName: string,
  key: string,
  buildSeedValue: () => T,
): Promise<T> => {
  const values = await updateJsonFileStore<T>(runtimePath, storeDirectory, fileName, (current) =>
    current[key] !== undefined ? current : { ...current, [key]: buildSeedValue() },
  );

  return values[key]!;
};
