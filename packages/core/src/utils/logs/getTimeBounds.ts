import { StoryResultMetadataWithChildren } from '../../types';

export const getTimeBounds = (logs: StoryResultMetadataWithChildren[]): { earliestStartedAt: string; latestFinishedAt: string } => {
  let earliestStartedAt = '';
  let latestFinishedAt = '';

  const traverse = (node: StoryResultMetadataWithChildren) => {
    // Skip timestamps that don't parse: calling toISOString on an invalid date
    // throws, and one malformed log entry must not break the whole bounds.
    const startedAtMs = new Date(node.startedAt).getTime();

    if (Number.isFinite(startedAtMs)) {
      if (!earliestStartedAt || node.startedAt < earliestStartedAt) {
        earliestStartedAt = node.startedAt;
      }

      const finishedAtMs = startedAtMs + node.executionTimeMs;
      if (Number.isFinite(finishedAtMs)) {
        const finishedAt = new Date(finishedAtMs).toISOString();
        if (!latestFinishedAt || finishedAt > latestFinishedAt) {
          latestFinishedAt = finishedAt;
        }
      }
    }

    for (const child of node.children) {
      traverse(child);
    }
  };

  for (const log of logs) {
    traverse(log);
  }

  return { earliestStartedAt, latestFinishedAt };
};
