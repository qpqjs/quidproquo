import { getApiGatewayEventHandler } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const apiGatewayEventHandler = getApiGatewayEventHandler(dynamicModuleLoader, getQpqConfig());
