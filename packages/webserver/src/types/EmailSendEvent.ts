import { Nullable } from '@qpqjs/core';
export enum EmailSendEventType {
  ResetPassword = 'ResetPassword',
  ResetPasswordAdmin = 'ResetPasswordAdmin',
  VerifyEmail = 'VerifyEmail',
}

export interface EmailSendEvent {
  eventType: EmailSendEventType;
  code: string;
  link: string;
  username: Nullable<string>;
  attributes: Record<string, string>;
}

export interface EmailSendEventResponse {
  body: string;
  subject: string;
}
