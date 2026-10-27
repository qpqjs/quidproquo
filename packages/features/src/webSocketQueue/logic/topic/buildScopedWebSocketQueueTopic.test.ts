import { describe, expect, it } from 'vitest';

import { buildScopedWebSocketQueueTopic } from './buildScopedWebSocketQueueTopic';

describe('buildScopedWebSocketQueueTopic', () => {
  it('prefixes the topic with the scope', () => {
    expect(buildScopedWebSocketQueueTopic('TENANT#t1', 'eventDoc#docs#1')).toBe('TENANT#t1#eventDoc#docs#1');
  });

  it('leaves the topic bare when there is no scope', () => {
    expect(buildScopedWebSocketQueueTopic(null, 'eventDoc#docs#1')).toBe('eventDoc#docs#1');
    expect(buildScopedWebSocketQueueTopic(undefined, 'eventDoc#docs#1')).toBe('eventDoc#docs#1');
    expect(buildScopedWebSocketQueueTopic('', 'eventDoc#docs#1')).toBe('eventDoc#docs#1');
  });
});
