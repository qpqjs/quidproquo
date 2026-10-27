import { Neo4jGraphEntity } from './Neo4jGraphEntity';

export type Neo4jRelationshipResult = Neo4jGraphEntity & {
  startNodeElementId: string;
  endNodeElementId: string;
  type: string;
};
