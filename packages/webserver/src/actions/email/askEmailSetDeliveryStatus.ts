import { createActionRequester } from 'quidproquo-core';

import { EmailActionType } from './EmailActionType';
import { EmailDeliveryStatus } from './EmailDeliveryStatus';

export type EmailSetDeliveryStatusActionPayload = {
  messageId: string;
  deliveryStatus: EmailDeliveryStatus;

  // Provider detail: drop reason, SMTP response for deferrals, bounce text
  reason?: string;
};

export const askEmailSetDeliveryStatus = createActionRequester<void>()({
  actionType: EmailActionType.SetDeliveryStatus,
  getPayload: (messageId: string, deliveryStatus: EmailDeliveryStatus, reason?: string) => ({ messageId, deliveryStatus, reason }),
});
