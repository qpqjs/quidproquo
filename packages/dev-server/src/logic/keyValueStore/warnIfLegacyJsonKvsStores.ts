import * as fs from 'fs';
import * as path from 'path';

/**
 * One-time note when json store files from the older json engine exist: the
 * sqlite engine does not read them. Local kvs data is throwaway, so there is no
 * migration tool. The files are deliberately left untouched so an older package
 * version can bring the json engine back up on its own data.
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
