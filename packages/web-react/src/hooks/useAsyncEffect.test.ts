import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useAsyncEffect } from './useAsyncEffect';

describe('useAsyncEffect', () => {
  afterEach(() => vi.restoreAllMocks());

  it('runs the async effect and reports a mounted status', async () => {
    let mountedDuringRun: boolean | undefined;
    renderHook(() =>
      useAsyncEffect(async (isMounted) => {
        mountedDuringRun = isMounted();
      }),
    );

    await waitFor(() => expect(mountedDuringRun).toBe(true));
  });

  it('runs the returned cleanup callback on unmount', async () => {
    const cleanup = vi.fn();
    const { unmount } = renderHook(() => useAsyncEffect(async () => cleanup));

    await waitFor(() => undefined);
    unmount();

    await waitFor(() => expect(cleanup).toHaveBeenCalled());
  });

  it('logs and swallows errors thrown by the effect', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderHook(() =>
      useAsyncEffect(async () => {
        throw new Error('boom');
      }),
    );

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
  });
});
