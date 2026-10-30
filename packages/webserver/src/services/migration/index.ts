// The migration service's public surface. Its entry points are loaded by runtime path (see
// defineMigration), so only what a HOST needs is exported: the local runner used by
// `qpq migrate`, and the shared notion of which migrations are still pending.
export * from './logic/askMigrationIsPending';
export * from './logic/askMigrationListPending';
export * from './logic/askMigrationRecordRan';
export * from './logic/askMigrationRunPending';
export * from './utils/getMigrationKey';
