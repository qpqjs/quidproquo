import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { preformNetworkRequest } = vi.hoisted(() => ({ preformNetworkRequest: vi.fn() }));

vi.mock('quidproquo-webserver', async (importOriginal: <T>() => Promise<T>) => {
  const original = await importOriginal<typeof import('quidproquo-webserver')>();
  return { ...original, preformNetworkRequest };
});

import { useNetworkRequest } from './useNetworkRequest';

describe('useNetworkRequest', () => {
  it('returns a requester that performs the network request with the payload', async () => {
    preformNetworkRequest.mockResolvedValue({ status: 200 });
    const payload = { url: 'https://api/thing', verb: 'GET' } as any;

    const { result } = renderHook(() => useNetworkRequest(payload));
    const response = await result.current();

    expect(preformNetworkRequest).toHaveBeenCalledWith(payload);
    expect(response).toEqual({ status: 200 });
  });
});
