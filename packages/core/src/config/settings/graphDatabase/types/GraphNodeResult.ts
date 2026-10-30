import { GraphEntity } from './GraphEntity';
import { GraphEntityType } from './GraphEntityType';

// GraphNodeResult extends the base type
export type GraphNodeResult = {
  $entityType: GraphEntityType.Node;
  $labels: string[];
} & GraphEntity;
