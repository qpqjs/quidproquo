import { Nullable } from '@qpqjs/core';

/**
 * The key a subscription is filed under: the connection's validated storage scope in front of the client's topic, so
 * senders in one scope can never reach subscribers in another. An unscoped connection or sender uses the bare topic.
 */
export const buildScopedWebSocketQueueTopic = (scope: Nullable<string> | undefined, topic: string): string => (scope ? `${scope}#${topic}` : topic);
