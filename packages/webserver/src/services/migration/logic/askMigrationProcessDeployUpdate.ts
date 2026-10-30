import { askConfigGetGlobal, askQueueSendMessages, AskResponse, DeployEventType, QueueMessage } from '@qpqjs/core';

import { QPQ_MIGRATIONS_RESOURCE_NAME } from '../../../config/constants';
import { Migration } from '../../../config/settings/migration';
import * as migrationInfoData from '../data/migrationInfoData';
import { getMigrationKey } from '../utils/getMigrationKey';
import { askMigrationIsPending } from './askMigrationIsPending';

export function* askMigrationProcessDeployUpdate(deployEventType: DeployEventType): AskResponse<void> {
  const allMigrations = yield* askConfigGetGlobal<Migration[]>(QPQ_MIGRATIONS_RESOURCE_NAME);
  const migrationsForThisDeploy = allMigrations.filter((m) => m.deployType === deployEventType);

  for (const migration of migrationsForThisDeploy) {
    const srcPathType = getMigrationKey(migration);

    // Ignore if we have already run it. Shared with the local runner (qpq migrate) so both
    // agree on what pending means.
    if (!(yield* askMigrationIsPending(migration))) {
      continue;
    }

    // Send a message to the queue to run the migration.
    const message: QueueMessage<undefined> = {
      type: srcPathType,
      payload: undefined,
    };

    yield* askQueueSendMessages(QPQ_MIGRATIONS_RESOURCE_NAME, message);

    // Insert the migration into into the database
    yield* migrationInfoData.askMigrationInfoUpsert({
      deployType: migration.deployType,
      srcPath: srcPathType,
    });
  }
}
