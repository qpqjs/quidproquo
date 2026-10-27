import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useStateUpdater } from './useStateUpdater';

type Form = { name: string; age: number };

describe('useStateUpdater', () => {
  it('returns a setter that updates a single property immutably', () => {
    const { result } = renderHook(() => {
      const [state, setState] = useState<Form>({ name: 'a', age: 1 });
      const update = useStateUpdater(setState);
      return { state, update };
    });

    act(() => result.current.update('name')('b'));

    expect(result.current.state).toEqual({ name: 'b', age: 1 });
  });

  it('leaves other properties untouched', () => {
    const { result } = renderHook(() => {
      const [state, setState] = useState<Form>({ name: 'a', age: 1 });
      const update = useStateUpdater(setState);
      return { state, update };
    });

    act(() => result.current.update('age')(2));

    expect(result.current.state).toEqual({ name: 'a', age: 2 });
  });
});
