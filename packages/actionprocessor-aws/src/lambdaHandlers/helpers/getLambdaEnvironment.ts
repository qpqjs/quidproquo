import { LambdaRuntimeConfig } from '../../runtimeConfig/LambdaRuntimeConfig';

/** What a lambda learns from its environment. The handler reads it once and passes the values down; processors never touch process.env. */
export type LambdaEnvironment = {
  userDirectoryName?: string;
  deployEventConfigName?: string;
  queueName?: string;
  lambdaRuntimeConfig: LambdaRuntimeConfig;
};

export const getLambdaEnvironment = (): LambdaEnvironment => ({
  userDirectoryName: process.env.userDirectoryName,
  deployEventConfigName: process.env.deployEventConfigName,
  queueName: process.env.queueName,
  lambdaRuntimeConfig: JSON.parse(process.env.lambdaRuntimeConfig || '{}') as LambdaRuntimeConfig,
});

/** A value the lambda cannot run without. Its construct sets the variable, so a missing one is a deploy fault, not a runtime case. */
export const requireLambdaEnvironment = (name: 'userDirectoryName' | 'deployEventConfigName' | 'queueName'): string => {
  const value = getLambdaEnvironment()[name];

  if (!value) {
    throw new Error(`Lambda environment variable [${name}] is not set`);
  }

  return value;
};
