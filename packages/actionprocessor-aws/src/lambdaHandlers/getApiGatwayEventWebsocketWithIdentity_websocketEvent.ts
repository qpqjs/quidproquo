import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from 'quidproquo-core';

import { APIGatewayEventWebsocketRequestContextV2, APIGatewayProxyWebsocketEventV2WithRequestContext } from 'aws-lambda';

import { getApiGatewayWebsocketEventEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

// TODO: this shape is also declared in getActionProcessor/core/event/apiGatwayEvent/websocket/types.ts;
// it belongs in one shared model file.
type ApiGatwayEventWebsocketWithIdentity = APIGatewayProxyWebsocketEventV2WithRequestContext<
  APIGatewayEventWebsocketRequestContextV2 & {
    identity: { sourceIp: string; userAgent: string };
  }
>;

export const getApiGatwayEventWebsocketWithIdentity_websocketEvent = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<ApiGatwayEventWebsocketWithIdentity>(
    QpqRuntimeType.WEBSOCKET_EVENT,
    getBlankStorySession,
    getApiGatewayWebsocketEventEventProcessor,
    dynamicModuleLoader,
    qpqConfig,
  );
