import { getQpqMigrationQueueTypeFromQpqFunctionRuntime, Migration } from '../../../config/settings/migration';

// A migration is identified by its source path, which is also its queue event type.
export const getMigrationKey = (migration: Migration): string => getQpqMigrationQueueTypeFromQpqFunctionRuntime(migration.runtime);
