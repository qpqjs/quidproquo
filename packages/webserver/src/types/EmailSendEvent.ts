import { Nullable } from '@qpqjs/core';
export enum EmailSendEventType {
  ResetPassword = 'ResetPassword',
  ResetPasswordAdmin = 'ResetPasswordAdmin',
  VerifyEmail = 'VerifyEmail',
}

export type EmailSendEvent = {
  eventType: EmailSendEventType;
  code: string;
  link: string;
  username: Nullable<string>;
  attributes: Record<string, string>;
};

export type EmailSendEventResponse = {
  body: string;
  subject: string;
};
