import { askThrowError } from '../../actions/error/askThrowError';
import { AnyGraphResult } from '../../config/settings/graphDatabase/types/AnyGraphResult';
import { GraphNodeResult } from '../../config/settings/graphDatabase/types/GraphNodeResult';
import { GraphRelationshipResult } from '../../config/settings/graphDatabase/types/GraphRelationshipResult';
import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { AskResponse } from '../../types/StorySession';
import { isGraphScalarResult } from './isGraphScalarResult';

/** What a vendor supplies to turn its own result cells into the platform-neutral graph results. */
export type GraphResultConverters<TResult, TNode extends TResult, TRelationship extends TResult> = {
  vendor: string;
  isNode: (result: TResult) => result is TNode;
  isRelationship: (result: TResult) => result is TRelationship;
  askConvertNode: (node: TNode) => AskResponse<GraphNodeResult>;
  askConvertRelationship: (relationship: TRelationship) => AskResponse<GraphRelationshipResult>;
};

/**
 * Builds the story that converts any one cell of a vendor's query result: scalars pass through,
 * nodes and relationships go through the vendor's converters, anything else is a wire-format
 * drift and throws. Neptune and Neo4j share this shape and differ only in the guards and converters.
 */
export function createAnyGraphResultConverter<TResult, TNode extends TResult, TRelationship extends TResult>(
  converters: GraphResultConverters<TResult, TNode, TRelationship>,
) {
  return function* askConvertAnyResultToAnyGraphResult(result: TResult): AskResponse<AnyGraphResult> {
    if (isGraphScalarResult(result)) {
      return result;
    }

    if (converters.isNode(result)) {
      return yield* converters.askConvertNode(result);
    }

    if (converters.isRelationship(result)) {
      return yield* converters.askConvertRelationship(result);
    }

    return yield* askThrowError(ErrorTypeEnum.GenericError, `Unable to convert ${converters.vendor} query result`);
  };
}
