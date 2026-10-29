import { GraphEntity } from './GraphEntity';
import { GraphEntityType } from './GraphEntityType';

// GraphRelationshipResult extends the base type
export type GraphRelationshipResult = {
  $entityType: GraphEntityType.Relationship;
  $start: string;
  $end: string;
  $type: string;
} & GraphEntity;
