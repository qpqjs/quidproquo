import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { destroy, instances } = vi.hoisted(() => ({ destroy: vi.fn(), instances: [] as Array<{ url: string }> }));

vi.mock('quidproquo-web', async (importOriginal: <T>() => Promise<T>) => {
  const original = await importOriginal<typeof import('quidproquo-web')>();
  return {
    ...original,
    WebsocketService: class {
      url: string;
      destroy = destroy;
      constructor(url: string) {
        this.url = url;
        instances.push(this);
      }
    },
  };
});

import { useWebsocketManagement } from './useWebsocketManagement';

describe('useWebsocketManagement', () => {
  afterEach(() => {
    destroy.mockClear();
    instances.length = 0;
  });

  it('creates a websocket service for the url', () => {
    const { result } = renderHook(() => useWebsocketManagement('wss://host'));

    expect(instances).toHaveLength(1);
    expect((result.current as any).url).toBe('wss://host');
  });

  it('destroys the service on unmount', () => {
    const { unmount } = renderHook(() => useWebsocketManagement('wss://host'));

    unmount();

    expect(destroy).toHaveBeenCalled();
  });
});
