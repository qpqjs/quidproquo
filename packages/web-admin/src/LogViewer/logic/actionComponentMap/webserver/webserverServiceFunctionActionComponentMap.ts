import { ServiceFunctionActionType } from '@qpqjs/webserver';

const webserverServiceFunctionActionComponentMap: Record<string, string[]> = {
  [ServiceFunctionActionType.Execute]: ['askServiceFunctionExecute', 'service', 'functionName', 'payload', 'isAsync'],
};

export default webserverServiceFunctionActionComponentMap;
