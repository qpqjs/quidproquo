import { describe, expect, it } from 'vitest';

import { WebsocketAdminClientMessageEventType } from './WebSocketQueueQpqAdminClientMessageEventType';

describe('WebsocketAdminClientMessageEventType', () => {
  it('names each admin client message event', () => {
    expect(WebsocketAdminClientMessageEventType).toEqual({
      RefreshLogMetadata: 'qpq/admin/ws/RefreshLogMetadata',
      MarkLogChecked: 'qpq/admin/ws/MarkLogChecked',
      ConfigSyncRequest: 'qpq/admin/ws/ConfigSyncRequest',
    });
  });
});
