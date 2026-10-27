import { describe, expect, it } from 'vitest';

import { askProcessOnConnect } from './askProcessOnConnect';
import { askProcessOnDisconnect } from './askProcessOnDisconnect';
import { askProcessOnMessage } from './askProcessOnMessage';
import { webSocketQueueLogic } from './webSocketQueueLogic';

describe('webSocketQueueLogic', () => {
  it('aggregates the websocket lifecycle processors', () => {
    expect(webSocketQueueLogic).toEqual({
      askProcessOnConnect,
      askProcessOnDisconnect,
      askProcessOnMessage,
    });
  });
});
