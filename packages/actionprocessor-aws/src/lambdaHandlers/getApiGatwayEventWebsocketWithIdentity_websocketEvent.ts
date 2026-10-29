import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from '@qpqjs/core';

import { APIGatewayEventWebsocketRequestContextV2, APIGatewayProxyWebsocketEventV2WithRequestContext } from 'aws-lambda';

import { getApiGatewayWebsocketEventEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { requireLambdaEnvironment } from './helpers/getLambdaEnvironment';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

// TODO: @joe-coady: this shape is also declared in getActionProcessor/core/event/apiGatwayEvent/websocket/types.ts;
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
    getApiGatewayWebsocketEventEventProcessor(requireLambdaEnvironment('websocketApiName')),
    dynamicModuleLoader,
    qpqConfig,
  );
