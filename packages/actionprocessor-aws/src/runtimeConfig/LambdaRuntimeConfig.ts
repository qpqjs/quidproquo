import { QpqFunctionRuntime } from 'quidproquo-core';

/**
 * Shape of the `lambdaRuntimeConfig` env var the CDK recurring-schedule
 * construct JSON-encodes onto its lambda: the story runtime the schedule
 * should execute.
 */
export type LambdaRuntimeConfig = {
  runtime: QpqFunctionRuntime;
};
