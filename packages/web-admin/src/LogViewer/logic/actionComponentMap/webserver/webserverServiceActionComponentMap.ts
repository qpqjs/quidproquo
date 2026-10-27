import { ServiceActionType } from 'quidproquo-features';

const webserverServiceActionComponentMap: Record<string, string[]> = {
  [ServiceActionType.Request]: ['askServiceRequest', 'serviceName', 'method', 'payload'],
};

export default webserverServiceActionComponentMap;
