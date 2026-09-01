import { closeAllKvsRepositories } from '../logic/keyValueStore/getKvsRepository';
import { warnIfLegacyJsonKvsStores } from '../logic/keyValueStore/warnIfLegacyJsonKvsStores';
import { DevServerShutdownPhase } from '../logic/shutdown/DevServerShutdownPhase';
import { DevServerPlugin } from './types/DevServerPlugin';

/**
 * The key-value stores.
 *
 * Stops LAST, in the Persist phase, because everything above it writes: a
 * request finishing during StopAccepting and a projection finishing during
 * Drain both land in a store, so closing earlier would miss exactly the work
 * the sequence exists to keep.
 *
 * Durability itself never needs the close - sqlite commits at the statement -
 * it folds kvs.db-wal back into kvs.db so a stopped server leaves one file.
 *
 * Repositories are opened lazily per service by getKvsRepository, so there is
 * nothing to open here; start is where the leftover json stores from the old
 * engine get their warning.
 */
export const kvsPlugin: DevServerPlugin = {
  name: 'kvs repositories',
  stopPhase: DevServerShutdownPhase.Persist,
  start: async (devServerConfig) => {
    warnIfLegacyJsonKvsStores(devServerConfig.runtimePath);

    return closeAllKvsRepositories;
  },
};
