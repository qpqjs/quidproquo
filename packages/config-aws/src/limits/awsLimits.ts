/** Lambda's own ceiling on a function timeout. */
export const LAMBDA_MAX_TIMEOUT_IN_SECONDS = 15 * 60;
/** Lambda's floor and ceiling on function memory. */
export const LAMBDA_MIN_MEMORY_IN_MIB = 128;
export const LAMBDA_MAX_MEMORY_IN_MIB = 10240;
/** API Gateway's cap on a request payload, so the largest single upload it can carry. */
export const API_GATEWAY_MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;

/** A function timeout Lambda accepts; a longer wish is cut to the ceiling (SQS retries, which may wait longer, still honour theirs). */
export const clampToLambdaTimeout = (timeoutInSeconds: number): number => Math.min(timeoutInSeconds, LAMBDA_MAX_TIMEOUT_IN_SECONDS);

/** Fails synth for a timeout Lambda would refuse; `what` names the setting in the error. */
export const assertLambdaTimeoutInSeconds = (timeoutInSeconds: number, what: string): void => {
  if (!Number.isInteger(timeoutInSeconds) || timeoutInSeconds < 1 || timeoutInSeconds > LAMBDA_MAX_TIMEOUT_IN_SECONDS) {
    throw new Error(`${what}: timeoutInSeconds [${timeoutInSeconds}] must be a whole number from 1 to ${LAMBDA_MAX_TIMEOUT_IN_SECONDS} on AWS`);
  }
};

/** Fails synth for a memory size Lambda would refuse; `what` names the setting in the error. */
export const assertLambdaMemoryInMiB = (memoryInMiB: number, what: string): void => {
  if (!Number.isInteger(memoryInMiB) || memoryInMiB < LAMBDA_MIN_MEMORY_IN_MIB || memoryInMiB > LAMBDA_MAX_MEMORY_IN_MIB) {
    throw new Error(
      `${what}: memoryInMiB [${memoryInMiB}] must be a whole number from ${LAMBDA_MIN_MEMORY_IN_MIB} to ${LAMBDA_MAX_MEMORY_IN_MIB} on AWS`,
    );
  }
};
