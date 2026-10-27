import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { ResolvedDevServerConfig } from '../../types';
import { KvsRepository } from './KvsRepository';
import { SqliteKvsRepository } from './SqliteKvsRepository';

// One repository instance per service, shared across the KVS action
// processors. Correctness doesn't depend on this any more (sqlite holds no
// in-memory state, every handle sees committed data); it just stops each
// processor from opening its own database handle.
const repositoryInstances = new Map<string, KvsRepository>();

export const getKvsRepository = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): KvsRepository => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  if (!repositoryInstances.has(serviceName)) {
    repositoryInstances.set(serviceName, new SqliteKvsRepository(devServerConfig.runtimePath, qpqConfig));
  }

  return repositoryInstances.get(serviceName)!;
};

/**
 * Close every open repository and forget it, so a later call reopens fresh.
 * Wired to the shutdown paths. Durability never needs this (sqlite commits at
 * the statement); close() just checkpoints the WAL so a stopped process leaves
 * one kvs.db instead of -wal/-shm sidecars.
 */
export const closeAllKvsRepositories = async (): Promise<void> => {
  const openRepositories = [...repositoryInstances.values()];
  repositoryInstances.clear();
  await Promise.all(openRepositories.map((repository) => repository.close()));
};
