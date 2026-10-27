import * as fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import * as path from 'path';

/**
 * Open (creating if needed) the kvs database at <runtimePath>/kvs/kvs.db.
 *
 * One file for the whole runtime, every service included. Handles on a
 * WAL-mode file see each other's committed writes immediately, so there is no
 * per-service cache and nothing to go stale.
 */
export const openKvsDatabase = (runtimePath: string): DatabaseSync => {
  const kvsDirectory = path.join(runtimePath, 'kvs');
  fs.mkdirSync(kvsDirectory, { recursive: true });

  // Not the pre-json engine's database.db: an old runtime dir may still hold
  // that file with the unscoped schema, and opening it would resurrect
  // pre-tenant data.
  const db = new DatabaseSync(path.join(kvsDirectory, 'kvs.db'));

  // busy_timeout only matters for other processes poking the file (sqlite3
  // cli, a db browser); in-process contention can't happen while transaction
  // bodies stay synchronous (see SqliteKvsRepository.runInImmediateTransaction).
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA temp_store = MEMORY');

  return db;
};
