import { EventDocDocument } from '../models';
import { EventDocMigration } from './EventDocMigration';
import { EventDocMigrations } from './EventDocMigrations';

/**
 * Type-safe migration-chain builder: each `.to`'s output is the next step's input, so adjacent steps must line up.
 * schemaVersion is omitted because the fold stamps it. Contiguity is a runtime guard; `.build()` erases to EventDocMigrations.
 */
export type MigrationChain<TCurrent extends EventDocDocument> = {
  to: <TNext extends EventDocDocument>(version: number, migrate: (state: TCurrent) => Omit<TNext, 'schemaVersion'>) => MigrationChain<TNext>;
  build: () => EventDocMigrations;
};

/** Starts a MigrationChain at the base shape. */
export const migrationChain = <TBase extends EventDocDocument = EventDocDocument>(): MigrationChain<TBase> => {
  const extend = <TCurrent extends EventDocDocument>(migrations: EventDocMigrations): MigrationChain<TCurrent> => ({
    to: <TNext extends EventDocDocument>(version: number, migrate: (state: TCurrent) => Omit<TNext, 'schemaVersion'>): MigrationChain<TNext> =>
      extend<TNext>({
        ...migrations,
        [version]: migrate as unknown as EventDocMigration,
      }),
    build: () => migrations,
  });

  return extend<TBase>({});
};
