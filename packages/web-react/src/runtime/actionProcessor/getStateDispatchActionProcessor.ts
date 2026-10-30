import { ActionProcessorListResolver, actionResult, askStateDispatchBase, createActionProcessor, ProcessorFor } from '@qpqjs/core';

import { Dispatch } from 'react';

const getProcessStateDispatch =
  (dispatch: Dispatch<any>): ProcessorFor<typeof askStateDispatchBase> =>
  async ({ action }) => {
    dispatch(action);

    return actionResult(undefined);
  };

export const getStateDispatchActionListResolver = (dispatch: Dispatch<any>): ActionProcessorListResolver =>
  createActionProcessor(askStateDispatchBase, () => getProcessStateDispatch(dispatch));
