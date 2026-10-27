import { GraphEntity } from './GraphEntity';
import { GraphEntityType } from './GraphEntityType';

// GraphNodeResult extends the base type
export interface GraphNodeResult extends GraphEntity {
  $entityType: GraphEntityType.Node;
  $labels: string[];
}
