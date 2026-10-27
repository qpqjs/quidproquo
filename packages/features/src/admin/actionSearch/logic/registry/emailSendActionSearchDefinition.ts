import {
  ActionHistory,
  ActionProcessorResult,
  isErroredActionResult,
  Nullable,
  resolveActionResult,
  resolveActionResultError,
  StoryResult,
} from 'quidproquo-core';
import { EmailActionType, EmailDeliveryStatus, EmailSendEmailActionPayload } from 'quidproquo-webserver';

import { ActionSearchDefinition } from '../../domain/ActionSearchDefinition';
import { ActionSearchExtractedAction } from '../../domain/ActionSearchExtractedAction';
import { ActionSearchFieldType } from '../../domain/ActionSearchFieldType';
import { ActionSearchFilterOperator } from '../../domain/ActionSearchFilterOperator';
import { emailEntityDefinition } from './emailEntityDefinition';

const extractEmailSend = (entry: ActionHistory, storyResult: StoryResult<any>, actionIndex: number): Nullable<ActionSearchExtractedAction> => {
  const payload = entry.act.payload as EmailSendEmailActionPayload | undefined;
  if (!payload) {
    return null;
  }

  const res = entry.res as ActionProcessorResult<string>;
  const succeeded = !isErroredActionResult(res);
  const messageId = succeeded ? resolveActionResult(res) : undefined;

  // Failed sends have no messageId; key them by origin so failures still fold to an entity
  const linkKey = messageId ? `email#${messageId}` : `email#${storyResult.correlation}#${actionIndex}`;

  return {
    fields: {
      from: payload.from,
      to: payload.to.join(', '),
      ...(payload.cc?.length ? { cc: payload.cc.join(', ') } : {}),
      subject: payload.subject,
      deliveryStatus: succeeded ? EmailDeliveryStatus.sent : EmailDeliveryStatus.dropped,
      ...(succeeded ? { messageId: messageId! } : { reason: resolveActionResultError(res).errorText }),
    },
    linkKey,
  };
};

export const emailSendActionSearchDefinition: ActionSearchDefinition = {
  action: {
    actionType: EmailActionType.SendEmail,
    viewName: 'Email Sends',
    fields: [
      { name: 'to', label: 'To', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
      { name: 'subject', label: 'Subject', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
      {
        name: 'deliveryStatus',
        label: 'Status',
        type: ActionSearchFieldType.Enum,
        operator: ActionSearchFilterOperator.Equals,
        enumValues: Object.values(EmailDeliveryStatus),
      },
    ],
    extract: extractEmailSend,
  },
  entity: emailEntityDefinition,
};
