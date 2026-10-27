import { useCallback, useContext, useRef, useState } from 'react';

import { BubbleReducerDispatchContext } from './BubbleReducerDispatchContext';
import { QpqBubbleReducer } from './QpqBubbleReducer';

export const useBubbleReducer = <TState>(
  reducer: QpqBubbleReducer<TState, any>,
  initialState: TState | (() => TState),
): [TState, (action: unknown) => void] => {
  const parentDispatch = useContext(BubbleReducerDispatchContext);
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatch = useCallback(
    (action: unknown) => {
      const [newState, preventBubble] = reducer(stateRef.current, action);

      if (preventBubble) {
        setState(newState);
      } else {
        parentDispatch(action);
      }
    },
    [parentDispatch, reducer],
  );

  return [state, dispatch];
};
