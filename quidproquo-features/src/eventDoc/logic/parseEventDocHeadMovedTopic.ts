import { Nullable } from 'quidproquo-core';

const TOPIC_PREFIX = 'eventDoc';

/** The store and document an unscoped head-moved topic (see eventDocHeadMovedTopic) names; null for any other topic. */
export const parseEventDocHeadMovedTopic = (topic: string): Nullable<{ storeName: string; docId: string }> => {
  const [prefix, storeName, docId, ...rest] = topic.split('#');

  if (prefix !== TOPIC_PREFIX || !storeName || !docId || rest.length > 0) {
    return null;
  }

  return { storeName, docId };
};
