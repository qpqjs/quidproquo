import { QpqjsServiceEnum } from '@qpqjs/constants';
import { ExcludeKeys, NetworkRequestActionPayload } from 'quidproquo';

export type AdminNetworkRequestPayload = ExcludeKeys<NetworkRequestActionPayload<string>, 'responseType' | 'basePath'> & {
  service: QpqjsServiceEnum;
};
