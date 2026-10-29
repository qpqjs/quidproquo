import { afterEach, describe, expect, it } from 'vitest';

import { getLambdaEnvironment, requireLambdaEnvironment } from './getLambdaEnvironment';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('getLambdaEnvironment', () => {
  it('reads the names and the schedule runtime from the environment', () => {
    process.env.userDirectoryName = 'ud';
    process.env.queueName = 'q';
    process.env.lambdaRuntimeConfig = JSON.stringify({ runtime: '/entry/schedule::run' });

    expect(getLambdaEnvironment()).toEqual({
      userDirectoryName: 'ud',
      deployEventConfigName: undefined,
      queueName: 'q',
      lambdaRuntimeConfig: { runtime: '/entry/schedule::run' },
    });
  });

  it('throws a deploy-fault message for a required value that is not set', () => {
    delete process.env.deployEventConfigName;

    expect(() => requireLambdaEnvironment('deployEventConfigName')).toThrow('Lambda environment variable [deployEventConfigName] is not set');
  });
});
