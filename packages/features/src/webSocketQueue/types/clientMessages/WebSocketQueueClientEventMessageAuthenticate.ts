import { AuthenticationInfo } from 'quidproquo-core';

import { WebSocketQueueEvent } from '../WebSocketQueueEvent';
import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueClientMessageEventType } from './WebSocketQueueClientMessageEventType';

export type WebSocketQueueClientEventPayloadAuthenticate = {
  accessToken?: AuthenticationInfo['accessToken'];

  // The connection's claimed storage scope (e.g. an active tenant id). The
  // configured connectionScopeResolver decides what actually gets stored: a
  // claim must resolve (e.g. pass the tenant membership check) or the whole
  // authenticate is rejected, and on tenant queues no claim resolves to the
  // user's own personal scope rather than leaving the connection unscoped.
  scope?: string;
};

export type WebSocketQueueClientEventMessageAuthenticate = WebSocketQueueEventMessage<
  WebSocketQueueClientEventPayloadAuthenticate,
  WebSocketQueueClientMessageEventType.Authenticate
>;

export type WebSocketQueueAuthenticateQueueEvent = WebSocketQueueEvent<
  WebSocketQueueClientMessageEventType.Authenticate,
  WebSocketQueueClientEventPayloadAuthenticate
>;
