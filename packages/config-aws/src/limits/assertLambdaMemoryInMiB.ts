import { LAMBDA_MAX_MEMORY_IN_MIB, LAMBDA_MIN_MEMORY_IN_MIB } from '../constants';

/** Fails synth for a memory size Lambda would refuse; `what` names the setting in the error. */
export const assertLambdaMemoryInMiB = (memoryInMiB: number, what: string): void => {
  if (!Number.isInteger(memoryInMiB) || memoryInMiB < LAMBDA_MIN_MEMORY_IN_MIB || memoryInMiB > LAMBDA_MAX_MEMORY_IN_MIB) {
    throw new Error(
      `${what}: memoryInMiB [${memoryInMiB}] must be a whole number from ${LAMBDA_MIN_MEMORY_IN_MIB} to ${LAMBDA_MAX_MEMORY_IN_MIB} on AWS`,
    );
  }
};
