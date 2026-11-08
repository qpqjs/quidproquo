import { afterEach, describe, expect, it } from 'vitest';

import { requireLambdaEnvironment } from './requireLambdaEnvironment';

describe('requireLambdaEnvironment', () => {
  afterEach(() => {
    delete process.env.deployEventConfigName;
  });

  it('throws a deploy-fault message for a required value that is not set', () => {
    delete process.env.deployEventConfigName;

    expect(() => requireLambdaEnvironment('deployEventConfigName')).toThrow('Lambda environment variable [deployEventConfigName] is not set');
  });
});
