import { RouteAuthValidationActionType } from 'quidproquo-webserver';

const webserverRouteAuthValidationActionComponentMap: Record<string, string[]> = {
  [RouteAuthValidationActionType.Decode]: ['askRouteAuthValidationDecode', 'event', 'routeAuthSettings', 'ignoreExpiration'],
  [RouteAuthValidationActionType.ResolveContext]: ['askRouteAuthValidationResolveContext', 'event', 'routeAuthSettings', 'decodedAccessToken'],
};

export default webserverRouteAuthValidationActionComponentMap;
