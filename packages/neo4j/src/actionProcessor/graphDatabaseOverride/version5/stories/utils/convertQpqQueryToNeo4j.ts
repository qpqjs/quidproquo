/**
 * Rewrites qpq's backend-neutral Cypher helpers into their Neo4j spellings.
 * Queries use qpqElementId(n) so the same string works on any graph backend;
 * Neo4j calls it elementId(n).
 */
export function convertQpqQueryToNeo4j(query: string): string {
  return query.replace(/qpqElementId\((.*?)\)/g, 'elementId($1)');
}
