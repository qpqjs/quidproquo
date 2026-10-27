import { actionResult, createActionProcessor, ProcessorFor } from 'quidproquo-core';
import { askEmailSetDeliveryStatus, EmailActionType } from 'quidproquo-webserver';

// Deliberately a no-op: the action's meaning is its log entry, which the admin
// action search folds into the email's entity via the messageId link key.
const getProcessSetDeliveryStatus = (): ProcessorFor<typeof askEmailSetDeliveryStatus> => {
  return async (payload) => {
    console.log('[email] delivery status recorded (dev server)', payload);

    return actionResult(undefined);
  };
};

export const getEmailSetDeliveryStatusActionProcessor = createActionProcessor(askEmailSetDeliveryStatus, () => getProcessSetDeliveryStatus());
