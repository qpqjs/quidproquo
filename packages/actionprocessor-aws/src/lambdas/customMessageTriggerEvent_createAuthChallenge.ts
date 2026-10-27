import { getCustomMessageTriggerEvent_createAuthChallenge } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const customMessageTriggerEvent_createAuthChallenge = getCustomMessageTriggerEvent_createAuthChallenge(dynamicModuleLoader, getQpqConfig());
