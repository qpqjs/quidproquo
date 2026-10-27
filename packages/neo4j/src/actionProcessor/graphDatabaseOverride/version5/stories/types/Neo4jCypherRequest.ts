/** Request body for the Neo4j Query API (POST /db/neo4j/query/v2). */
export type Neo4jCypherRequest = {
  statement: string;
  parameters?: Record<string, unknown>;
};
