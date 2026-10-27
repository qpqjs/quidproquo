import { createContext } from 'react';

// Default NOOP dispatcher: an action that bubbles past the root is dropped.
export const BubbleReducerDispatchContext = createContext<(action: any) => void>((_action: any): void => {
  // NOOP
});
