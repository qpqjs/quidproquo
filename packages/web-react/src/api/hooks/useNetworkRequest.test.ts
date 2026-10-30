import { NetworkRequestActionPayload } from '@qpqjs/core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useNetworkRequest } from './useNetworkRequest';

// The real performNetworkRequest runs; only the fetch transport underneath it is stubbed.
const fetchMock = vi.fn();

beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => vi.unstubAllGlobals());

describe('useNetworkRequest', () => {
  it('returns a requester that sends the payload over fetch', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const payload = { url: 'https://api/thing', method: 'GET' } as NetworkRequestActionPayload<any>;

    const { result } = renderHook(() => useNetworkRequest(payload));
    const response = await result.current();

    expect(fetchMock).toHaveBeenCalledWith('https://api/thing', expect.objectContaining({ method: 'GET' }));
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
  });
});
