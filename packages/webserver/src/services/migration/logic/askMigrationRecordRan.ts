import { AskResponse } from '@qpqjs/core';

import { Migration } from '../../../config/settings/migration';
import * as migrationInfoData from '../data/migrationInfoData';
import { getMigrationKey } from '../utils/getMigrationKey';

// Record a migration as run, so neither the deploy path nor the local runner picks it up again.
export function* askMigrationRecordRan(migration: Migration): AskResponse<void> {
  yield* migrationInfoData.askMigrationInfoUpsert({
    deployType: migration.deployType,
    srcPath: getMigrationKey(migration),
  });
}
