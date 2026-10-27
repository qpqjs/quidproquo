import { getAnyExecuteServiceFunctionEvent_serviceFunction } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const anyExecuteServiceFunctionEvent_serviceFunction = getAnyExecuteServiceFunctionEvent_serviceFunction(dynamicModuleLoader, getQpqConfig());
