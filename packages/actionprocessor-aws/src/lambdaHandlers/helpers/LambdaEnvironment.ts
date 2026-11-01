import { QpqFunctionRuntime } from '@qpqjs/core';

import { KvsStreamLambdaSettings } from '../../runtimeConfig/KvsStreamLambdaSettings';
import { LambdaRuntimeConfig } from '../../runtimeConfig/LambdaRuntimeConfig';

/** What a lambda learns from its environment. The handler reads it once and passes the values down; processors never touch process.env. */
export type LambdaEnvironment = {
  userDirectoryName?: string;
  deployEventConfigName?: string;
  queueName?: string;
  storageDriveName?: string;
  websocketApiName?: string;
  keyValueStoreName?: string;
  lambdaRuntimeConfig: LambdaRuntimeConfig;
  // The storage drive event lambda's handler (storageDriveEntry).
  storageDriveRuntime: QpqFunctionRuntime;
  // The kvs stream projector lambda's settings, minus the store name carried above.
  kvsStream: Omit<KvsStreamLambdaSettings, 'keyValueStoreName'>;
};
