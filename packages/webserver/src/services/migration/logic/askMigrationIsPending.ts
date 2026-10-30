import { AskResponse } from '@qpqjs/core';

import { Migration } from '../../../config/settings/migration';
import * as migrationInfoData from '../data/migrationInfoData';
import { getMigrationKey } from '../utils/getMigrationKey';

// Has this migration already been recorded as run? Shared by the deploy path and the local
// runner so the two can never disagree about what "pending" means, a runner that answered
// differently would either re-run a migration or skip one.
export function* askMigrationIsPending(migration: Migration): AskResponse<boolean> {
  const migrationInfo = yield* migrationInfoData.askMigrationGetBySrcPath(getMigrationKey(migration));

  return !migrationInfo;
}
