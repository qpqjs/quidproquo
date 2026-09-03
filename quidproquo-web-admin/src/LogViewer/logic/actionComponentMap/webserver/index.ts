import webserverAdminActionComponentMap from './webserverAdminActionComponentMap';
import webserverApiKeyValidationActionComponentMap from './webserverApiKeyValidationActionComponentMap';
import webserverDnsActionComponentMap from './webserverDnsActionComponentMap';
import webserverEmailActionComponentMap from './webserverEmailActionComponentMap';
import webserverGenericDataResourceActionComponentMap from './webserverGenericDataResourceActionComponentMap';
import webserverRouteAuthValidationActionComponentMap from './webserverRouteAuthValidationActionComponentMap';
import webserverServiceActionComponentMap from './webserverServiceActionComponentMap';
import webserverServiceFunctionActionComponentMap from './webserverServiceFunctionActionComponentMap';
import webserverWebEntryActionComponentMap from './webserverWebEntryActionComponentMap';
import webserverWebsocketActionComponentMap from './webserverWebsocketActionComponentMap';

export default {
  ...webserverAdminActionComponentMap,
  ...webserverApiKeyValidationActionComponentMap,
  ...webserverDnsActionComponentMap,
  ...webserverEmailActionComponentMap,
  ...webserverGenericDataResourceActionComponentMap,
  ...webserverRouteAuthValidationActionComponentMap,
  ...webserverServiceActionComponentMap,
  ...webserverServiceFunctionActionComponentMap,
  ...webserverWebEntryActionComponentMap,
  ...webserverWebsocketActionComponentMap,
};
