import { askGraphDatabaseExecuteOpenCypherQuery, AskResponse, GraphDatabaseInstanceType, ScheduledEventParams } from 'quidproquo-core';

/**
 * Scheduled entry point that runs a trivial read query so the Neo4j Aura
 * instance counts as active (Aura pauses databases that sit idle for a few
 * days). Wired up daily by defineGraphDatabaseNeo4j.
 */
export function* keepAlive(event: ScheduledEventParams<{ databaseName: string }>): AskResponse<void> {
  yield* askGraphDatabaseExecuteOpenCypherQuery(event.metadata.databaseName, GraphDatabaseInstanceType.Read, 'RETURN 1 AS result');
}
