import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askQueueSendMessages } from './askQueueSendMessages';
import { QueueActionType } from './QueueActionType';

describe('askQueueSendMessages', () => {
  it('yields a SendMessages action with the queue name and collected messages', () => {
    const m1 = { body: { a: 1 } } as any;
    const m2 = { body: { a: 2 } } as any;

    const { action } = captureRequester(askQueueSendMessages('my-queue', m1, m2));

    expect(action).toEqual({
      type: QueueActionType.SendMessages,
      payload: {
        queueName: 'my-queue',
        queueMessages: [m1, m2],
      },
    });
  });

  it('passes FIFO groupId and deduplicationId through untouched', () => {
    const message = { type: 'Demo/Job', payload: { a: 1 }, groupId: 'user-42', deduplicationId: 'dedup-1' };

    const { action } = captureRequester(askQueueSendMessages('my-queue', message));

    expect(action.payload.queueMessages).toEqual([message]);
  });

  it('yields an empty queueMessages array when none are given', () => {
    const { action } = captureRequester(askQueueSendMessages('my-queue'));

    expect(action).toEqual({
      type: QueueActionType.SendMessages,
      payload: {
        queueName: 'my-queue',
        queueMessages: [],
      },
    });
  });

  it('resumes with no value once the runtime accepts the messages', () => {
    const { returned } = captureRequester(askQueueSendMessages('my-queue', { type: 'Demo/Job', payload: {} }), undefined);

    expect(returned).toBeUndefined();
  });
});
