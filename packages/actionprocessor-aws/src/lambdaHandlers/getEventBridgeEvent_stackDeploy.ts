import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from '@qpqjs/core';

import { EventBridgeEvent } from 'aws-lambda';

import { getEventBridgeStackDeployEventActionProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';
import { requireLambdaEnvironment } from './helpers/requireLambdaEnvironment';

export const getEventBridgeEvent_stackDeploy = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<EventBridgeEvent<string, void>>(
    QpqRuntimeType.DEPLOY_EVENT,
    getBlankStorySession,
    getEventBridgeStackDeployEventActionProcessor(requireLambdaEnvironment('deployEventConfigName')),
    dynamicModuleLoader,
    qpqConfig,
  );
