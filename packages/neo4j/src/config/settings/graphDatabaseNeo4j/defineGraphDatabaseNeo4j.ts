import {
  CrossModuleOwner,
  defineActionProcessors,
  defineParameter,
  defineRecurringSchedule,
  defineSecret,
  QPQConfig,
  QPQConfigAdvancedSettings,
  QpqFunctionRuntimeAdvanced,
} from 'quidproquo-core';

import { Neo4jVersion } from './Neo4jVersion';

export type QPQConfigAdvancedGraphDatabaseNeo4jSettings = QPQConfigAdvancedSettings & {
  owner?: CrossModuleOwner<'graphDatabaseName'>;
  version?: Neo4jVersion;
};

// Entry points are resolved at runtime relative to this file's compiled
// location (basePath), so the deployed bundle can load them dynamically.
const buildQpqFunctionRuntime = (relativePath: string, functionName: string): QpqFunctionRuntimeAdvanced => {
  return {
    basePath: __dirname,
    relativePath: relativePath,
    functionName,
  };
};

/**
 * Backs a qpq graph database with a Neo4j Aura instance.
 *
 * Declares the `neo4j-<db>-instance` parameter and `neo4j-<db>-password`
 * secret the query story reads, overrides the graph database action
 * processors, and schedules a daily keep-alive query (Aura pauses instances
 * that sit idle for a few days).
 */
export const defineGraphDatabaseNeo4j = (databaseName: string, options?: QPQConfigAdvancedGraphDatabaseNeo4jSettings): QPQConfig => {
  const version = options?.version ?? Neo4jVersion.Version5;

  return [
    defineParameter(`neo4j-${databaseName}-instance`, {
      owner: options?.owner,
    }),
    defineSecret(`neo4j-${databaseName}-password`, {
      owner: options?.owner,
    }),

    defineActionProcessors(buildQpqFunctionRuntime(`../../../actionProcessor/graphDatabaseOverride/${version}`, 'getGraphDatabaseActionProcessor')),

    defineRecurringSchedule(
      { dailyAtUtc: { hour: 0, minute: 0 } },
      buildQpqFunctionRuntime('../../../entry/scheduledEvents/keepAlive', 'keepAlive'),
      {
        metadata: {
          databaseName: databaseName,
        },
        owner: options?.owner,
      },
    ),
  ];
};
