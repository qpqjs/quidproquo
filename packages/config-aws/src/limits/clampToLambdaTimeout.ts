import { LAMBDA_MAX_TIMEOUT_IN_SECONDS } from '../constants';

/** A function timeout Lambda accepts; a longer wish is cut to the ceiling (SQS retries, which may wait longer, still honour theirs). */
export const clampToLambdaTimeout = (timeoutInSeconds: number): number => Math.min(timeoutInSeconds, LAMBDA_MAX_TIMEOUT_IN_SECONDS);
