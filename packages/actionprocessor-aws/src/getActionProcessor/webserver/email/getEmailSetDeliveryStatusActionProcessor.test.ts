import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';
import { EmailActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEmailSetDeliveryStatusActionProcessor } from './getEmailSetDeliveryStatusActionProcessor';

// Deliberately a no-op: the action's meaning is its log entry, which the admin action search folds into the email's entity.
describe('getEmailSetDeliveryStatusActionProcessor', () => {
  it('accepts the status and answers nothing', async () => {
    const processors = await getEmailSetDeliveryStatusActionProcessor(buildTestQpqConfig(), {} as any);

    const [result, error] = await invokeProcessor(processors![EmailActionType.SetDeliveryStatus]!, {
      messageId: 'message-1',
      status: 'delivered',
    } as any);

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
  });
});
