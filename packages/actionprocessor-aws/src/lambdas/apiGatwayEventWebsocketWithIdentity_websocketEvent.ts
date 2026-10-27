import { getApiGatwayEventWebsocketWithIdentity_websocketEvent } from '../lambdaHandlers';
import { dynamicModuleLoader } from './dynamicModuleLoader';
import { getQpqConfig } from './lambda-utils';

export const apiGatwayEventWebsocketWithIdentity_websocketEvent = getApiGatwayEventWebsocketWithIdentity_websocketEvent(
  dynamicModuleLoader,
  getQpqConfig(),
);
