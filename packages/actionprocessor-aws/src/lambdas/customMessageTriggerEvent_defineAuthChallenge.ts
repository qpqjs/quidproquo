import { getCustomMessageTriggerEvent_defineAuthChallenge } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const customMessageTriggerEvent_defineAuthChallenge = getCustomMessageTriggerEvent_defineAuthChallenge(dynamicModuleLoader, getQpqConfig());
