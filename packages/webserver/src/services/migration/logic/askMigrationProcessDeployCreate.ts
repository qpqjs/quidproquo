import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import { QPQ_MIGRATIONS_RESOURCE_NAME } from '../../../config/constants';
import { Migration } from '../../../config/settings/migration';
import * as migrationInfoData from '../data/migrationInfoData';
import { getMigrationKey } from '../utils/getMigrationKey';

export function* askMigrationProcessDeployCreate(): AskResponse<void> {
  const allMigrations = yield* askConfigGetGlobal<Migration[]>(QPQ_MIGRATIONS_RESOURCE_NAME);

  // Insert all migrations into the database
  // we don't need to run any current migrations
  // because database should be ready with seed data.
  for (const migration of allMigrations) {
    yield* migrationInfoData.askMigrationInfoUpsert({
      deployType: migration.deployType,
      srcPath: getMigrationKey(migration),
    });
  }
}
