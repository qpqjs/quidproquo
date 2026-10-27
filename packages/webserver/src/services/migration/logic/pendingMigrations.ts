import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { getQpqMigrationQueueTypeFromQpqFunctionRuntime, Migration } from '../../../config/settings/migration';
import * as migrationInfoData from '../data/migrationInfoData';

// A migration is identified by its source path, which is also its queue event type.
export const getMigrationKey = (migration: Migration): string => getQpqMigrationQueueTypeFromQpqFunctionRuntime(migration.runtime);

// Has this migration already been recorded as run? Shared by the deploy path and the local
// runner so the two can never disagree about what "pending" means — a runner that answered
// differently would either re-run a migration or skip one.
export function* askIsMigrationPending(migration: Migration): AskResponse<boolean> {
  const migrationInfo = yield* migrationInfoData.askGetMigrationBySrcPath(getMigrationKey(migration));

  return !migrationInfo;
}

// Every configured migration, in declaration order (the config preserves the sorted filename
// order the app registered them in, so dependencies between migrations hold).
export function* askAllMigrations(): AskResponse<Migration[]> {
  return yield* askConfigGetGlobal<Migration[]>('qpqMigrations');
}

// The ones not yet recorded as run, in order.
export function* askPendingMigrations(): AskResponse<Migration[]> {
  const allMigrations = yield* askAllMigrations();

  const pending: Migration[] = [];

  for (const migration of allMigrations) {
    if (yield* askIsMigrationPending(migration)) {
      pending.push(migration);
    }
  }

  return pending;
}

// Record a migration as run, so neither the deploy path nor the local runner picks it up again.
export function* askRecordMigrationRan(migration: Migration): AskResponse<void> {
  yield* migrationInfoData.askUpsert({
    deployType: migration.deployType,
    srcPath: getMigrationKey(migration),
  });
}
