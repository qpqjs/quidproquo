import { StoryResultMetadata } from 'quidproquo-core';

import { WebSocketQueueEventMessage } from '../../../../../webSocketQueue';
import { WebSocketQueueQpqAdminServerMessageEventType } from './WebSocketQueueQpqAdminServerMessageEventType';

export type WebSocketQueueQpqAdminServerEventPayloadLogMetadata = {
  log: StoryResultMetadata;
};

export type WebSocketQueueQpqAdminServerEventMessageLogMetadata = WebSocketQueueEventMessage<
  WebSocketQueueQpqAdminServerEventPayloadLogMetadata,
  WebSocketQueueQpqAdminServerMessageEventType.LogMetadata
>;
