import { GraphNodeResult } from '../../config/settings/graphDatabase/types/GraphNodeResult';
import { GraphRelationshipResult } from '../../config/settings/graphDatabase/types/GraphRelationshipResult';
import { AskResponse } from '../../types/StorySession';

/** What a vendor supplies to turn its own result cells into the platform-neutral graph results. */
export type GraphResultConverters<TResult, TNode extends TResult, TRelationship extends TResult> = {
  vendor: string;
  isNode: (result: TResult) => result is TNode;
  isRelationship: (result: TResult) => result is TRelationship;
  askConvertNode: (node: TNode) => AskResponse<GraphNodeResult>;
  askConvertRelationship: (relationship: TRelationship) => AskResponse<GraphRelationshipResult>;
};
