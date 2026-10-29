import { ExcludeKeys, NetworkRequestActionPayload } from 'quidproquo';

import { TodoServiceEnum } from '@todo/constants';

export type AdminNetworkRequestPayload = ExcludeKeys<NetworkRequestActionPayload<string>, 'responseType' | 'basePath'> & {
  service: TodoServiceEnum;
};
