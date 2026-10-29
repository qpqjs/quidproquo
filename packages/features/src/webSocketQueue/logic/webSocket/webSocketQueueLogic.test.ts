import { describe, expect, it } from 'vitest';

import { askWebSocketQueueProcessConnect } from './askWebSocketQueueProcessConnect';
import { askWebSocketQueueProcessDisconnect } from './askWebSocketQueueProcessDisconnect';
import { askWebSocketQueueProcessMessage } from './askWebSocketQueueProcessMessage';
import { webSocketQueueLogic } from './webSocketQueueLogic';

describe('webSocketQueueLogic', () => {
  it('aggregates the websocket lifecycle processors', () => {
    expect(webSocketQueueLogic).toEqual({
      askWebSocketQueueProcessConnect,
      askWebSocketQueueProcessDisconnect,
      askWebSocketQueueProcessMessage,
    });
  });
});
