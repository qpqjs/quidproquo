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

type RequiredLambdaEnvironmentName =
  'userDirectoryName' | 'deployEventConfigName' | 'queueName' | 'storageDriveName' | 'websocketApiName' | 'keyValueStoreName';

/** A value the lambda cannot run without. Its construct sets the variable, so a missing one is a deploy fault, not a runtime case. */
export const requireLambdaEnvironment = (name: RequiredLambdaEnvironmentName): string => {
  const value = getLambdaEnvironment()[name];

  if (!value) {
    throw new Error(`Lambda environment variable [${name}] is not set`);
  }

  return value;
};
