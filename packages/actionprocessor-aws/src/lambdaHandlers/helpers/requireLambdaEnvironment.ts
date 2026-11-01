import { getLambdaEnvironment } from './getLambdaEnvironment';

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
