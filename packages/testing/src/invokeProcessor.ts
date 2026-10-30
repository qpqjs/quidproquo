import { QPQError } from '@qpqjs/core';

import { buildTestStorySession } from './runtimeTesting';

/**
 * The runtime arguments every action processor receives after its payload. Tests almost never
 * care about these, so they are stubbed by default and only overridden where a test needs a real
 * one (a story session, logger, dynamic module loader or stream registry).
 */
export type ProcessorRuntimeOverrides = {
  session?: unknown;
  actionProcessors?: unknown;
  logger?: unknown;
  updateSession?: unknown;
  dynamicModuleLoader?: unknown;
  streamRegistry?: unknown;
};

// `any` params on purpose: each processor declares its own concrete payload and runtime arg
// types, and function parameters are contravariant, so `unknown` here would reject every real
// processor.
type TestableProcessor<TResult> = (
  payload: any,
  session: any,
  actionProcessors: any,
  logger: any,
  updateSession: any,
  dynamicModuleLoader: any,
  streamRegistry: any,
) => Promise<[TResult?, QPQError?]>;

/**
 * Calls an action processor with the given payload and inert runtime args: a default test story
 * session, no sibling processors, a logger and stream registry that are never read, a no-op session
 * updater and a module loader that finds nothing. Each can be overridden for the rare test that
 * needs a real one.
 */
export const invokeProcessor = <TResult = unknown>(
  processor: TestableProcessor<TResult>,
  payload: unknown,
  overrides: ProcessorRuntimeOverrides = {},
): Promise<[TResult?, QPQError?]> =>
  processor(
    payload,
    overrides.session ?? buildTestStorySession(),
    overrides.actionProcessors ?? {},
    overrides.logger ?? {},
    overrides.updateSession ?? (() => {}),
    overrides.dynamicModuleLoader ?? (() => null),
    overrides.streamRegistry ?? {},
  );
