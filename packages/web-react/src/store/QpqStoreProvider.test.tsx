import { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { createQpqStore } from './createQpqStore';
import { QpqStoreProvider } from './QpqStoreProvider';
import { useQpqStore } from './useQpqStore';

describe('QpqStoreProvider', () => {
  it('provides a store it owns when none is passed', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <QpqStoreProvider>{children}</QpqStoreProvider>;

    const { result } = renderHook(() => useQpqStore(), { wrapper });

    expect(typeof result.current.bindArea).toBe('function');
  });

  it('provides the app-owned store when one is passed', () => {
    const appStore = createQpqStore();
    const wrapper = ({ children }: { children: ReactNode }) => <QpqStoreProvider store={appStore}>{children}</QpqStoreProvider>;

    const { result } = renderHook(() => useQpqStore(), { wrapper });

    expect(result.current).toBe(appStore);
  });

  it('useQpqStore throws without a provider', () => {
    // React's development build rethrows a render error through a window error event so devtools
    // can pause on it, and jsdom prints every unhandled one to stderr. Handling the event keeps the
    // run quiet; the throw still reaches toThrow.
    const markHandled = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', markHandled);
    try {
      expect(() => renderHook(() => useQpqStore())).toThrow('useQpqStore must be used inside a QpqStoreProvider');
    } finally {
      window.removeEventListener('error', markHandled);
    }
  });
});
