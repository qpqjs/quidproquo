import { AskResponse } from 'quidproquo-core';

import { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { createQpqStore, QpqStore } from '../store/createQpqStore';
import { qpqStoreContext } from '../store/qpqStoreContext';
import { createQpqRuntimeComputed } from './createQpqRuntimeComputed';
import { createQpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { useQpqRuntime } from './useQpqRuntime';
import { useQpqRuntimeComputed } from './useQpqRuntimeComputed';

type State = { count: number; other: string };
type Action = { type: 'inc' } | { type: 'setOther'; other: string };

const reducer = (state: State, action: Action): [State, boolean] => {
  if (action.type === 'inc') {
    return [{ ...state, count: state.count + 1 }, true];
  }
  if (action.type === 'setOther') {
    return [{ ...state, other: action.other }, true];
  }
  return [state, false];
};

const buildDefinition = (uniqueName: string) =>
  createQpqRuntimeDefinition<State, Action, {}>({ uniqueName, api: {}, initialState: { count: 0, other: '' }, reducer });

const buildWrapper = (store: QpqStore) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <qpqStoreContext.Provider value={store}>{children}</qpqStoreContext.Provider>;
  };

describe('useQpqRuntimeComputed', () => {
  it('derives a slice of the area state', () => {
    const definition = buildDefinition('derive');
    const computed = createQpqRuntimeComputed(definition, (s) => s.count);

    const { result } = renderHook(() => useQpqRuntimeComputed(computed), { wrapper: buildWrapper(createQpqStore()) });

    expect(result.current).toBe(0);
  });

  it('reflects updates dispatched through a runtime bound to the same area', async () => {
    const definition = buildDefinition('shared');
    const computed = createQpqRuntimeComputed(definition, (s) => s.count);

    const { result } = renderHook(
      () => {
        const value = useQpqRuntimeComputed(computed);
        const [, , dispatch] = useQpqRuntime(definition);
        return { value, dispatch };
      },
      { wrapper: buildWrapper(createQpqStore()) },
    );

    act(() => result.current.dispatch({ type: 'inc' }));

    await waitFor(() => expect(result.current.value).toBe(1));
  });

  it('re-renders only when the slice actually changes', () => {
    const store = createQpqStore();
    const definition = buildDefinition('stable');
    const computed = createQpqRuntimeComputed(definition, (s) => s.count);
    let renders = 0;

    const { result } = renderHook(
      () => {
        renders += 1;
        return useQpqRuntimeComputed(computed);
      },
      { wrapper: buildWrapper(store) },
    );

    const rendersAfterMount = renders;

    act(() => store.setAreaState('stable', { count: 0, other: 'changed' }));
    expect(renders).toBe(rendersAfterMount);
    expect(result.current).toBe(0);

    act(() => store.setAreaState('stable', { count: 2, other: 'changed' }));
    expect(renders).toBeGreaterThan(rendersAfterMount);
    expect(result.current).toBe(2);
  });

  it('binds the area: a selector-only component seeds state and runs onInit', async () => {
    let initRuns = 0;
    function* askInit(): AskResponse<void> {
      initRuns += 1;
    }

    const store = createQpqStore();
    const definition = createQpqRuntimeDefinition<State, Action, {}>({
      uniqueName: 'selector-init',
      api: {},
      initialState: { count: 0, other: '' },
      reducer,
      onInit: askInit,
    });
    const computed = createQpqRuntimeComputed(definition, (s) => s.count);

    const { unmount } = renderHook(() => useQpqRuntimeComputed(computed), { wrapper: buildWrapper(store) });

    await waitFor(() => expect(initRuns).toBe(1));
    expect(store.hasArea('selector-init')).toBe(true);

    unmount();
    expect(store.hasArea('selector-init')).toBe(false);
  });
});
