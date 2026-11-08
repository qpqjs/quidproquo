import { QpqFunctionRuntime } from '@qpqjs/core';

import { LambdaRuntimeConfig } from '../../runtimeConfig/LambdaRuntimeConfig';
import { LambdaEnvironment } from './LambdaEnvironment';

const NO_RUNTIME = '"/::"';

export const getLambdaEnvironment = (): LambdaEnvironment => ({
  userDirectoryName: process.env.userDirectoryName,
  deployEventConfigName: process.env.deployEventConfigName,
  queueName: process.env.queueName,
  storageDriveName: process.env.storageDriveName,
  websocketApiName: process.env.websocketApiName,
  keyValueStoreName: process.env.keyValueStoreName,
  lambdaRuntimeConfig: JSON.parse(process.env.lambdaRuntimeConfig || '{}') as LambdaRuntimeConfig,
  storageDriveRuntime: JSON.parse(process.env.storageDriveEntry || NO_RUNTIME) as QpqFunctionRuntime,
  kvsStream: {
    runtime: JSON.parse(process.env.kvsStreamEntry || NO_RUNTIME) as QpqFunctionRuntime,
    coalesceByPartitionKey: process.env.kvsStreamCoalesceByPartitionKey === 'true',
    partitionKey: process.env.kvsStreamPartitionKey || '',
  },
});
