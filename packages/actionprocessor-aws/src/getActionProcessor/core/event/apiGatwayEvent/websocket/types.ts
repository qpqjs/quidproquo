import { MatchStoryResult } from '@qpqjs/core';
import { WebsocketEvent, WebsocketEventResponse } from '@qpqjs/webserver';

import {
  APIGatewayEventWebsocketRequestContextV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2WithRequestContext,
  Context,
} from 'aws-lambda';

type ApiGatwayEventWebsocketWithIdentity = APIGatewayProxyWebsocketEventV2WithRequestContext<
  APIGatewayEventWebsocketRequestContextV2 & {
    identity: { sourceIp: string; userAgent: string };
  }
>;

export const GLOBAL_WEBSOCKET_API_NAME = process.env.websocketApiName!;

// Externals - The ins and outs of the external event
export type EventInput = [ApiGatwayEventWebsocketWithIdentity, Context];
export type EventOutput = APIGatewayProxyResultV2;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = WebsocketEvent<string | Blob | ArrayBuffer>;
export type InternalEventOutput = WebsocketEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
