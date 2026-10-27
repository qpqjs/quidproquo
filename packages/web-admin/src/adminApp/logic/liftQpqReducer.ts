import { QpqReducer } from 'quidproquo-core';

// Lifts a slice reducer onto the root state: effects the slice handles update
// that key immutably; unhandled effects bubble so the next reducer can try.
export const liftQpqReducer =
  <TRoot, TKey extends keyof TRoot, TEffect>(key: TKey, reducer: QpqReducer<TRoot[TKey], TEffect>): QpqReducer<TRoot, TEffect> =>
  (state: TRoot, effect: TEffect): [TRoot, boolean] => {
    const [slice, handled] = reducer(state[key], effect);

    if (!handled) {
      return [state, false];
    }

    return [{ ...state, [key]: slice }, true];
  };
