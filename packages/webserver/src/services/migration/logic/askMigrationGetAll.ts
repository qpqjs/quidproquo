import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import { QPQ_MIGRATIONS_RESOURCE_NAME } from '../../../config/constants';
import { Migration } from '../../../config/settings/migration';

// Every configured migration, in declaration order (the config preserves the sorted filename
// order the app registered them in, so dependencies between migrations hold).
export function* askMigrationGetAll(): AskResponse<Migration[]> {
  return yield* askConfigGetGlobal<Migration[]>(QPQ_MIGRATIONS_RESOURCE_NAME);
}
