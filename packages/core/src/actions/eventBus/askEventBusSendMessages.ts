import { CrossModuleMessage } from '../../types';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { EventBusActionType } from './EventBusActionType';

export type EventBusMessage<T> = CrossModuleMessage<T> & {
  /** FIFO event buses only: message group for ordering. Defaults to the event bus name (global ordering). */
  groupId?: string;

  /** FIFO event buses only: dedup id (5-min SNS window). Defaults to a generated uuid (no dedup). */
  deduplicationId?: string;
};

export interface EventBusSendMessageOptions<T> {
  eventBusName: string;
  eventBusMessages: EventBusMessage<T>[];
}

export const askEventBusSendMessagesBase = createActionRequester<void>()({
  actionType: EventBusActionType.SendMessages,
  errorTypes: [
    'AccessDenied', // caller lacks permission to publish to the topic
    'TopicNotFound', // the SNS topic does not exist
    'ServiceUnavailable', // SNS internal error / throttling
  ],
  getPayload: (eventBusSendMessageOptions: EventBusSendMessageOptions<unknown>) => eventBusSendMessageOptions,
});

// Generic so callers can pin the message body shape at the call site.
export function* askEventBusSendMessages<T>(eventBusSendMessageOptions: EventBusSendMessageOptions<T>): AskResponse<void> {
  return yield* askEventBusSendMessagesBase(eventBusSendMessageOptions as EventBusSendMessageOptions<unknown>);
}
