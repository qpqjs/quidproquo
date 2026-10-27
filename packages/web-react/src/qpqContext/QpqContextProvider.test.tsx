import { createContextIdentifier } from 'quidproquo-core';

import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { QpqContextProvider } from './QpqContextProvider';
import { useQpqContextValue } from './useQpqContextValue';
import { useQpqContextValues } from './useQpqContextValues';

const identifier = createContextIdentifier<string>('greeting', 'default');

describe('useQpqContextValue', () => {
  it('returns the identifier default when nothing is provided', () => {
    const { result } = renderHook(() => useQpqContextValue(identifier));

    expect(result.current).toBe('default');
  });

  it('returns the provided value', () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QpqContextProvider, { contextIdentifier: identifier, value: 'hello' }, children);

    const { result } = renderHook(() => useQpqContextValue(identifier), { wrapper });

    expect(result.current).toBe('hello');
  });

  it('merges values from nested providers', () => {
    const other = createContextIdentifier<number>('count', 0);
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        QpqContextProvider,
        { contextIdentifier: identifier, value: 'outer' },
        createElement(QpqContextProvider, { contextIdentifier: other, value: 5 }, children),
      );

    const { result } = renderHook(() => useQpqContextValues(), { wrapper });

    expect(result.current).toEqual({ greeting: 'outer', count: 5 });
  });
});
