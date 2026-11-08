import { DynamicModuleLoader, QPQConfig, QpqRuntimeType } from '@qpqjs/core';

import { VerifyAuthChallengeResponseTriggerEvent } from 'aws-lambda';

import { getCognitoVerifyAuthChallengeEventProcessor } from '../getActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';
import { requireLambdaEnvironment } from './helpers/requireLambdaEnvironment';

export const getCustomMessageTriggerEvent_verifyAuthChallenge = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) =>
  getQpqLambdaRuntimeForEvent<VerifyAuthChallengeResponseTriggerEvent>(
    QpqRuntimeType.AUTH_VERIFY_AUTH_CHALLENGE,
    getBlankStorySession,
    getCognitoVerifyAuthChallengeEventProcessor(requireLambdaEnvironment('userDirectoryName')),
    dynamicModuleLoader,
    qpqConfig,
  );
