import { describe, expect, it } from 'vitest';

import { WebSocketQueueQpqAdminServerMessageEventType } from './WebSocketQueueQpqAdminServerMessageEventType';

describe('WebSocketQueueQpqAdminServerMessageEventType', () => {
  it('names each admin server message event', () => {
    expect(WebSocketQueueQpqAdminServerMessageEventType).toEqual({
      LogMetadata: 'Qpq/admin/server/LogMetadata',
      ModifySetting: 'Qpq/admin/server/ModifySetting',
      TraceDone: 'Qpq/admin/server/TraceDone',
    });
  });
});
