import * as fs from 'fs';
import * as path from 'path';

/**
 * One-time note when leftover json store files exist: the engine changed to
 * sqlite and no longer reads them. Local kvs data is throwaway, so there is no
 * migration tool. The files are deliberately left untouched - reverting the
 * package version brings the json engine back up on its own data.
 */
export const warnIfLegacyJsonKvsStores = (runtimePath: string): void => {
  const kvsRoot = path.join(runtimePath, 'kvs');
  if (!fs.existsSync(kvsRoot)) {
    return;
  }

  const legacyStoreFiles = fs.readdirSync(kvsRoot, { recursive: true, encoding: 'utf-8' }).filter((entry) => entry.endsWith('.json'));
  if (legacyStoreFiles.length === 0) {
    return;
  }

  console.warn(
    `[qpq] The dev-server KVS engine changed from json files to sqlite (${path.join(kvsRoot, 'kvs.db')}). ` +
      `${legacyStoreFiles.length} legacy .json store file(s) under ${kvsRoot} are no longer read and can be deleted.`,
  );
};
