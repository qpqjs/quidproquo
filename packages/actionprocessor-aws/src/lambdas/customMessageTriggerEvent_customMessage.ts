import { getCustomMessageTriggerEvent_customMessage } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const customMessageTriggerEvent_customMessage = getCustomMessageTriggerEvent_customMessage(dynamicModuleLoader, getQpqConfig());
