import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEmailSetDeliveryStatus } from './askEmailSetDeliveryStatus';
import { EmailActionType } from './EmailActionType';
import { EmailDeliveryStatus } from './EmailDeliveryStatus';

describe('askEmailSetDeliveryStatus', () => {
  it('yields a SetDeliveryStatus action with the messageId, status and reason', () => {
    const { action } = captureRequester(askEmailSetDeliveryStatus('msg-123', EmailDeliveryStatus.deferred, '421 try again later'));

    expect(action).toEqual({
      type: EmailActionType.SetDeliveryStatus,
      payload: {
        messageId: 'msg-123',
        deliveryStatus: EmailDeliveryStatus.deferred,
        reason: '421 try again later',
      },
    });
  });

  it('omits the reason when not provided', () => {
    const { action } = captureRequester(askEmailSetDeliveryStatus('msg-123', EmailDeliveryStatus.delivered));

    expect(action).toEqual({
      type: EmailActionType.SetDeliveryStatus,
      payload: {
        messageId: 'msg-123',
        deliveryStatus: EmailDeliveryStatus.delivered,
        reason: undefined,
      },
    });
  });
});
