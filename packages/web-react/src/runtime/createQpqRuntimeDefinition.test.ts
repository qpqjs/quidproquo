import { describe, expect, it } from 'vitest';

import { createQpqRuntimeDefinition } from './createQpqRuntimeDefinition';

type State = { count: number };
const initialState: State = { count: 0 };
const api = {};

describe('createQpqRuntimeDefinition', () => {
  it('keeps the provided unique name, api, initial state and reducer', () => {
    const reducer = (s: State): [State, boolean] => [s, true];
    const definition = createQpqRuntimeDefinition<State, unknown, typeof api>({ uniqueName: 'thing', api, initialState, reducer });

    expect(definition).toMatchObject({ uniqueName: 'thing', api, initialState, reducer });
  });

  it('defaults the reducer to bubble everything', () => {
    const definition = createQpqRuntimeDefinition<State, unknown, typeof api>({ uniqueName: 'thing', api, initialState });

    expect(definition.reducer({ count: 3 }, { type: 'anything' })).toEqual([{ count: 3 }, false]);
  });
});
