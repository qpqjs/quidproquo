import { useContext } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { QpqStoreProvider } from '../store/QpqStoreProvider';
import { BubbleReducerDispatchContext } from './BubbleReducerDispatchContext';
import { createQpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { QpqRuntimeEffectCatcher } from './QpqRuntimeEffectCatcher';

type State = { count: number };

describe('QpqRuntimeEffectCatcher', () => {
  it('renders children and provides a bubble dispatcher', () => {
    const runtime = createQpqRuntimeDefinition<State, { type: string }, {}>({
      uniqueName: 'fx',
      api: {},
      initialState: { count: 0 },
      reducer: (s) => [s, false],
    });

    let dispatch: ((action: any) => void) | undefined;
    const Probe = () => {
      dispatch = useContext(BubbleReducerDispatchContext);
      return <span>child</span>;
    };

    const { getByText } = render(
      <QpqStoreProvider>
        <QpqRuntimeEffectCatcher runtime={runtime}>
          <Probe />
        </QpqRuntimeEffectCatcher>
      </QpqStoreProvider>,
    );

    expect(getByText('child')).toBeDefined();
    expect(typeof dispatch).toBe('function');
  });
});
