import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from '@qpqjs/core';

import { CustomMessageTriggerEvent } from 'aws-lambda';

import { getCognitoDefineAuthChallengeEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { requireLambdaEnvironment } from './helpers/getLambdaEnvironment';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

export const getCustomMessageTriggerEvent_defineAuthChallenge = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<CustomMessageTriggerEvent>(
    QpqRuntimeType.AUTH_DEFINE_AUTH_CHALLENGE,
    getBlankStorySession,
    getCognitoDefineAuthChallengeEventProcessor(requireLambdaEnvironment('userDirectoryName')),
    dynamicModuleLoader,
    qpqConfig,
  );
