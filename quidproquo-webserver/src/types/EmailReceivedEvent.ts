import { EmailMessage } from '../actions/email/EmailMessage';

/** What a defineEmailReceiver's onEmail receives, once per delivered message. */
export type EmailReceivedEvent = {
  message: EmailMessage;
};

export type EmailReceivedEventResponse = void;
