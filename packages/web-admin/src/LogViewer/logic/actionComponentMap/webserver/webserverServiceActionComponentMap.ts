import { ServiceActionType } from '@qpqjs/features';

const webserverServiceActionComponentMap: Record<string, string[]> = {
  [ServiceActionType.Request]: ['askServiceRequest', 'serviceName', 'method', 'payload'],
};

export default webserverServiceActionComponentMap;
