import { getUserScriptRunnerEvent_userScript } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const userScriptRunnerEvent_userScript = getUserScriptRunnerEvent_userScript(dynamicModuleLoader, getQpqConfig());
