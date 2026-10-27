import { GraphEntity } from './GraphEntity';
import { GraphEntityType } from './GraphEntityType';

// GraphRelationshipResult extends the base type
export interface GraphRelationshipResult extends GraphEntity {
  $entityType: GraphEntityType.Relationship;
  $start: string;
  $end: string;
  $type: string;
}
