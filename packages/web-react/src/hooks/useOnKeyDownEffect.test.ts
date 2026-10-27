import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useOnKeyDownEffect } from './useOnKeyDownEffect';

const pressKey = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key }));

describe('useOnKeyDownEffect', () => {
  it('invokes the callback when the target key is pressed', () => {
    const callback = vi.fn();
    renderHook(() => useOnKeyDownEffect('Enter', true, callback));

    pressKey('Enter');

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const callback = vi.fn();
    renderHook(() => useOnKeyDownEffect('Enter', true, callback));

    pressKey('Escape');

    expect(callback).not.toHaveBeenCalled();
  });

  it('does nothing when inactive', () => {
    const callback = vi.fn();
    renderHook(() => useOnKeyDownEffect('Enter', false, callback));

    pressKey('Enter');

    expect(callback).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useOnKeyDownEffect('Enter', true, callback));

    unmount();
    pressKey('Enter');

    expect(callback).not.toHaveBeenCalled();
  });
});
