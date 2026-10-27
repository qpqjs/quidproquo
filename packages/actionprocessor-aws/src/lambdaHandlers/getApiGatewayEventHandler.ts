import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from 'quidproquo-core';

import { APIGatewayEvent } from 'aws-lambda';

import { getApiGatewayApiEventEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

export const getApiGatewayEventHandler = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<APIGatewayEvent>(
    QpqRuntimeType.API,
    getBlankStorySession,
    getApiGatewayApiEventEventProcessor,
    dynamicModuleLoader,
    qpqConfig,
  );
