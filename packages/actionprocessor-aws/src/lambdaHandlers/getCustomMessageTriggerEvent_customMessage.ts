import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from 'quidproquo-core';

import { CustomMessageTriggerEvent } from 'aws-lambda';

import { getCognitoCustomMessageEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

export const getCustomMessageTriggerEvent_customMessage = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<CustomMessageTriggerEvent>(
    QpqRuntimeType.SEND_EMAIL_EVENT,
    getBlankStorySession,
    getCognitoCustomMessageEventProcessor,
    dynamicModuleLoader,
    qpqConfig,
  );
