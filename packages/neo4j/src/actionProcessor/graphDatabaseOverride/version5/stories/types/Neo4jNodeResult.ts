import { Neo4jGraphEntity } from './Neo4jGraphEntity';

export type Neo4jNodeResult = Neo4jGraphEntity & {
  labels: string[];
};
