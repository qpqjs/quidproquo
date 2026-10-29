import { generateUuid, getProcessCustomImplementation, ProcessorFor } from '@qpqjs/core';
import { ActionProcessorListResolverFactory } from '@qpqjs/web-react';

import { AdminSessionActionType, askApplySessionEventBase, askApplySessionEventToLog } from '../actions';
import { AdminAppState } from '../AdminAppState';

// Runs the ApplyEvent story in a sub-runtime that inherits the live processors,
// so it can dispatch into the admin runtime's state like any story.
export const getApplySessionEventActionProcessor: ActionProcessorListResolverFactory<AdminAppState> = () => async (qpqConfig) => ({
  [AdminSessionActionType.applyEvent]: getProcessCustomImplementation<ProcessorFor<typeof askApplySessionEventBase>>(
    qpqConfig,
    askApplySessionEventToLog,
    'Apply Admin Session Event',
    null,
    () => new Date().toISOString(),
    () => generateUuid(),
  ),
});
