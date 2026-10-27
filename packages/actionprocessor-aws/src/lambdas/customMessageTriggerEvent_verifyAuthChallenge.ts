import { getCustomMessageTriggerEvent_verifyAuthChallenge } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const customMessageTriggerEvent_verifyAuthChallenge = getCustomMessageTriggerEvent_verifyAuthChallenge(dynamicModuleLoader, getQpqConfig());
