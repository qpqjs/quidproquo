import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { BubbleReducerDispatchContext } from './BubbleReducerDispatchContext';
import { QpqBubbleReducer } from './QpqBubbleReducer';
import { useBubbleReducer } from './useBubbleReducer';

type State = { count: number };

describe('useBubbleReducer', () => {
  it('applies the new state when the reducer prevents bubbling', () => {
    const reducer: QpqBubbleReducer<State, { by: number }> = (state, action) => [{ count: state.count + action.by }, true];
    const { result } = renderHook(() => useBubbleReducer(reducer, { count: 0 }));

    act(() => result.current[1]({ by: 3 }));

    expect(result.current[0]).toEqual({ count: 3 });
  });

  it('bubbles the action to the parent dispatch when not prevented', () => {
    const parentDispatch = vi.fn();
    const reducer: QpqBubbleReducer<State, unknown> = (state) => [state, false];
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(BubbleReducerDispatchContext.Provider, { value: parentDispatch }, children);

    const { result } = renderHook(() => useBubbleReducer(reducer, { count: 0 }), { wrapper });

    act(() => result.current[1]({ type: 'up' }));

    expect(parentDispatch).toHaveBeenCalledWith({ type: 'up' });
  });
});
