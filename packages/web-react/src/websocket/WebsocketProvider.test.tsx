import { createElement, useContext } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

const { destroy } = vi.hoisted(() => ({ destroy: vi.fn() }));

vi.mock('quidproquo-web', async (importOriginal) => {
  const original = await importOriginal<typeof import('quidproquo-web')>();
  return {
    ...original,
    WebsocketService: class {
      url: string;
      destroy = destroy;
      constructor(url: string) {
        this.url = url;
      }
    },
  };
});

import { WebSocketContext } from './WebsocketContext';
import { WebsocketProvider } from './WebsocketProvider';

describe('WebsocketProvider', () => {
  it('provides the managed websocket service to descendants', () => {
    let provided: any;
    const Probe = () => {
      provided = useContext(WebSocketContext);
      return null;
    };

    render(createElement(WebsocketProvider, { wsUrl: 'wss://host' }, createElement(Probe)));

    expect(provided?.url).toBe('wss://host');
  });
});
