import { afterEach, describe, expect, it } from 'vitest';

import { getLambdaEnvironment, requireLambdaEnvironment } from './getLambdaEnvironment';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('getLambdaEnvironment', () => {
  it('reads the names and the runtimes each lambda kind is stamped with', () => {
    process.env.userDirectoryName = 'ud';
    process.env.queueName = 'q';
    process.env.lambdaRuntimeConfig = JSON.stringify({ runtime: '/entry/schedule::run' });
    process.env.storageDriveName = 'uploads';
    process.env.storageDriveEntry = JSON.stringify('/entry/drive::onEvent');
    process.env.keyValueStoreName = 'events';
    process.env.kvsStreamEntry = JSON.stringify('/entry/kvs::onStream');
    process.env.kvsStreamCoalesceByPartitionKey = 'true';
    process.env.kvsStreamPartitionKey = 'pk';
    process.env.websocketApiName = 'ws';

    expect(getLambdaEnvironment()).toEqual({
      userDirectoryName: 'ud',
      deployEventConfigName: undefined,
      queueName: 'q',
      storageDriveName: 'uploads',
      websocketApiName: 'ws',
      keyValueStoreName: 'events',
      lambdaRuntimeConfig: { runtime: '/entry/schedule::run' },
      storageDriveRuntime: '/entry/drive::onEvent',
      kvsStream: { runtime: '/entry/kvs::onStream', coalesceByPartitionKey: true, partitionKey: 'pk' },
    });
  });

  it('falls back to the no-runtime marker and an empty partition key when a lambda kind is not stamped', () => {
    for (const name of ['storageDriveEntry', 'kvsStreamEntry', 'kvsStreamCoalesceByPartitionKey', 'kvsStreamPartitionKey']) {
      delete process.env[name];
    }

    const environment = getLambdaEnvironment();

    expect(environment.storageDriveRuntime).toBe('/::');
    expect(environment.kvsStream).toEqual({ runtime: '/::', coalesceByPartitionKey: false, partitionKey: '' });
  });

  it('throws a deploy-fault message for a required value that is not set', () => {
    delete process.env.deployEventConfigName;

    expect(() => requireLambdaEnvironment('deployEventConfigName')).toThrow('Lambda environment variable [deployEventConfigName] is not set');
  });
});
