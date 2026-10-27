import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';

import { eventBus } from './eventBus';

describe('eventBus', () => {
  it('is a singleton EventEmitter', () => {
    expect(eventBus).toBeInstanceOf(EventEmitter);
  });

  it('publish emits the event with its payload to listeners', async () => {
    const listener = vi.fn();
    eventBus.on('channel-publish', listener);

    await eventBus.publish('channel-publish', { type: 'thing' });

    expect(listener).toHaveBeenCalledWith({ type: 'thing' });
    eventBus.off('channel-publish', listener);
  });

  it('publishAndWaitForResponse resolves when the response correlation fires back', async () => {
    eventBus.on('channel-rpc', (payload, responseCorrelation) => {
      eventBus.emit(responseCorrelation, { echoed: payload });
    });

    const response = await eventBus.publishAndWaitForResponse('channel-rpc', { ask: 1 });

    expect(response).toEqual({ echoed: { ask: 1 } });
    eventBus.removeAllListeners('channel-rpc');
  });
});
