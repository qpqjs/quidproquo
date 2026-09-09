import { AskResponse } from 'quidproquo-core';

import { askEventDocReadState } from '../actions/eventDocEvent/askEventDocReadState';

/**
 * Mints a doc type's typed read verb, the one home of the unknown to TView assertion. Kept off the definition object:
 * the definition imports the api verbs and the verbs call this reader, so hanging it there would form an import cycle.
 */
export const createEventDocStateReader = <TView>() =>
  function* askReadState(): AskResponse<TView> {
    return (yield* askEventDocReadState()) as TView;
  };
