import { askKeyValueStoreQuery, askKeyValueStoreUpsert, AskResponse, kvsEqual } from '@qpqjs/core';

import { QPQ_MIGRATIONS_RESOURCE_NAME } from '../../../config/constants';
import { MigrationInfo } from '../domain/Migration';

export function* askMigrationGetBySrcPath(srcPath: string, nextPageKey?: string): AskResponse<MigrationInfo | undefined> {
  const migrationInfo = yield* askKeyValueStoreQuery<MigrationInfo>(QPQ_MIGRATIONS_RESOURCE_NAME, kvsEqual('srcPath', srcPath), {
    nextPageKey,
  });

  return migrationInfo.items[0];
}

export function* askMigrationInfoUpsert(migrationInfo: MigrationInfo): AskResponse<void> {
  yield* askKeyValueStoreUpsert<MigrationInfo>(QPQ_MIGRATIONS_RESOURCE_NAME, migrationInfo);
}
