import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { actionResult, actionResultError, actionResultErrorFromCaughtError, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askEmailSendEmail, EmailActionType } from 'quidproquo-webserver';

import { sendEmail } from '../../../logic/sesV2/sendEmail';

const getProcessSendEmail = (qpqConfig: QPQConfig): ProcessorFor<typeof askEmailSendEmail> => {
  return async (payload) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const messageId = await sendEmail(payload, region);

      return actionResult(messageId);
    } catch (error) {
      return actionResultErrorFromCaughtError(error, {
        MessageRejected: () => actionResultError(askEmailSendEmail.errorType.MessageRejected, 'Message rejected'),
        MailFromDomainNotVerifiedException: () => actionResultError(askEmailSendEmail.errorType.SenderNotVerified, 'Sender domain not verified'),
        AccountSuspendedException: () => actionResultError(askEmailSendEmail.errorType.AccountSuspended, 'Email sending account suspended'),
        SendingPausedException: () => actionResultError(askEmailSendEmail.errorType.SendingPaused, 'Email sending is paused'),
        TooManyRequestsException: () => actionResultError(askEmailSendEmail.errorType.Throttled, 'Rate exceeded'),
        LimitExceededException: () => actionResultError(askEmailSendEmail.errorType.LimitExceeded, 'Sending limit exceeded'),
        BadRequestException: () => actionResultError(askEmailSendEmail.errorType.BadRequest, 'Invalid email request'),
      });
    }
  };
};

export const getEmailSendEmailActionProcessor = createActionProcessor(askEmailSendEmail, getProcessSendEmail);
