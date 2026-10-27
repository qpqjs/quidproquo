/** Fields shared by every Neo4j graph entity (nodes and relationships). */
export type Neo4jGraphEntity = {
  elementId: string;
  properties: Record<string, unknown>;
};
