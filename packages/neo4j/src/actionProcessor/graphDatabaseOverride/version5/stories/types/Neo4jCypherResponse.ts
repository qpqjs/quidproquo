import { AnyNeo4jResult } from './AnyNeo4jResult';
import { Neo4jNotification } from './Neo4jNotification';

/**
 * Response body from the Neo4j Query API. Each entry in `values` is one result
 * row, with cells in the same order as `fields`.
 */
export type Neo4jCypherResponse = {
  data: {
    fields: string[];
    values: AnyNeo4jResult[][];
  };
  notifications?: Neo4jNotification[];
  bookmarks?: string[];
};
