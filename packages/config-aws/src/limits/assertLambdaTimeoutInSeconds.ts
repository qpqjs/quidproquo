import { LAMBDA_MAX_TIMEOUT_IN_SECONDS } from '../constants';

/** Fails synth for a timeout Lambda would refuse; `what` names the setting in the error. */
export const assertLambdaTimeoutInSeconds = (timeoutInSeconds: number, what: string): void => {
  if (!Number.isInteger(timeoutInSeconds) || timeoutInSeconds < 1 || timeoutInSeconds > LAMBDA_MAX_TIMEOUT_IN_SECONDS) {
    throw new Error(`${what}: timeoutInSeconds [${timeoutInSeconds}] must be a whole number from 1 to ${LAMBDA_MAX_TIMEOUT_IN_SECONDS} on AWS`);
  }
};
