import { QpqRuntimeType, StoryResultMetadataWithChildren } from '../../types';

export const getTotalExecutionTime = (logs: StoryResultMetadataWithChildren[]): number => {
  let totalExecutionTimeMs = 0;

  const traverse = (node: StoryResultMetadataWithChildren) => {
    // Add the node's execution time to the total
    if (node.runtimeType === QpqRuntimeType.EXECUTE_STORY) {
      totalExecutionTimeMs += node.executionTimeMs;
    }

    // Recursively process each child
    for (const child of node.children) {
      traverse(child);
    }
  };

  // Start the traversal for each log entry
  for (const log of logs) {
    traverse(log);
  }

  return totalExecutionTimeMs;
};
