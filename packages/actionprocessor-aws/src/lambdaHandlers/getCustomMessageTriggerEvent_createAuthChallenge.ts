import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from '@qpqjs/core';

import { CustomMessageTriggerEvent } from 'aws-lambda';

import { getCognitoCreateAuthChallengeEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';
import { requireLambdaEnvironment } from './helpers/requireLambdaEnvironment';

export const getCustomMessageTriggerEvent_createAuthChallenge = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<CustomMessageTriggerEvent>(
    QpqRuntimeType.AUTH_CREATE_AUTH_CHALLENGE,
    getBlankStorySession,
    getCognitoCreateAuthChallengeEventProcessor(requireLambdaEnvironment('userDirectoryName')),
    dynamicModuleLoader,
    qpqConfig,
  );
