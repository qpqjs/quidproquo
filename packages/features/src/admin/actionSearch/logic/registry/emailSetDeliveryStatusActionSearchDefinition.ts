import { ActionHistory, Nullable } from 'quidproquo-core';
import { EmailActionType, EmailDeliveryStatus, EmailSetDeliveryStatusActionPayload } from 'quidproquo-webserver';

import { ActionSearchDefinition } from '../../domain/ActionSearchDefinition';
import { ActionSearchExtractedAction } from '../../domain/ActionSearchExtractedAction';
import { ActionSearchFieldType } from '../../domain/ActionSearchFieldType';
import { ActionSearchFilterOperator } from '../../domain/ActionSearchFilterOperator';
import { emailEntityDefinition } from './emailEntityDefinition';

const extractEmailSetDeliveryStatus = (entry: ActionHistory): Nullable<ActionSearchExtractedAction> => {
  const payload = entry.act.payload as EmailSetDeliveryStatusActionPayload | undefined;
  if (!payload) {
    return null;
  }

  return {
    fields: {
      messageId: payload.messageId,
      deliveryStatus: payload.deliveryStatus,
      ...(payload.reason ? { reason: payload.reason } : {}),
    },
    linkKey: `email#${payload.messageId}`,
  };
};

export const emailSetDeliveryStatusActionSearchDefinition: ActionSearchDefinition = {
  action: {
    actionType: EmailActionType.SetDeliveryStatus,
    viewName: 'Email Status Updates',
    fields: [
      { name: 'messageId', label: 'Message Id', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
      {
        name: 'deliveryStatus',
        label: 'Status',
        type: ActionSearchFieldType.Enum,
        operator: ActionSearchFilterOperator.Equals,
        enumValues: Object.values(EmailDeliveryStatus),
      },
      { name: 'reason', label: 'Reason', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
    ],
    extract: extractEmailSetDeliveryStatus,
  },
  entity: emailEntityDefinition,
};
