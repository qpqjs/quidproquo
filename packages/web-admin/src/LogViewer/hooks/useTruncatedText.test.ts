import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useTruncatedText } from './useTruncatedText';

describe('useTruncatedText', () => {
  it('flags text with more than three lines as truncatable', () => {
    const { result } = renderHook(() => useTruncatedText('a\nb\nc\nd'));

    expect(result.current.canTruncate).toBe(true);
    expect(result.current.truncatedText).toBe('a\nb\nc...');
  });

  it('does not truncate short text', () => {
    const { result } = renderHook(() => useTruncatedText('a\nb'));

    expect(result.current.canTruncate).toBe(false);
  });

  it('copies the full text to the clipboard', () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useTruncatedText('hello'));
    result.current.handleCopy();

    expect(writeText).toHaveBeenCalledWith('hello');
  });
});
