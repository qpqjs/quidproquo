import { AskResponse } from '@qpqjs/core';

import { Migration } from '../../../config/settings/migration';
import { askMigrationGetAll } from './askMigrationGetAll';
import { askMigrationIsPending } from './askMigrationIsPending';

// The ones not yet recorded as run, in order.
export function* askMigrationListPending(): AskResponse<Migration[]> {
  const allMigrations = yield* askMigrationGetAll();

  const pending: Migration[] = [];

  for (const migration of allMigrations) {
    if (yield* askMigrationIsPending(migration)) {
      pending.push(migration);
    }
  }

  return pending;
}
