import {
  ActionProcessorList,
  ActionProcessorListResolver,
  actionResult,
  actionResultError,
  AskResponse,
  createRuntime,
  defineApplicationModule,
  DynamicModuleLoader,
  QpqLogger,
  QpqRuntimeType,
  StoryResult,
  StorySession,
  toCrossServiceSession,
} from 'quidproquo-core';

import { getCoreActionProcessor } from '../../actionProcessor/core';

// ─── Real-runtime composition harness ─────────────────────────────────────────────
//
// Integration tests in this folder run control-flow primitives (askCatch, askRunParallel,
// askContextProvideValue, askOverrideActions ...) through the ACTUAL runtime: createRuntime
// driving the real core action processors (getCoreActionProcessor), with no mocking of the
// runtime or its control flow.
//
// Test-specific additions, all real processors executed by the real runtime:
//   echo / failLeaf  deterministic leaf values so an oracle can predict outcomes
//   boundary         crosses a service boundary exactly as the real send/execute processors
//                    do: strip local context via toCrossServiceSession, then start a fresh
//                    runtime for the sub-story.

export const ECHO_ACTION = 'qpqtest/echo';
export const FAIL_ACTION = 'qpqtest/fail';
export const BOUNDARY_ACTION = 'qpqtest/boundary';

const RUNTIME_CONFIG = defineApplicationModule('CompositionTests', 'composition', 'development', '.', './dist');
const getDateNow = () => '2026-06-26T00:00:00.000Z';

const silentLogger: QpqLogger = {
  enableLogs: async () => {},
  log: async () => {},
  waitToFinishWriting: async () => {},
  moveToPermanentStorage: async () => {},
};

// A leaf that succeeds with `value`.
export const echo = (value: unknown): AskResponse<any> =>
  (function* () {
    return yield { type: ECHO_ACTION, payload: { value } };
  })();

// A leaf whose processor fails with an error whose type/text are both `error`.
export const failLeaf = (error: string): AskResponse<any> =>
  (function* () {
    return yield { type: FAIL_ACTION, payload: { error } };
  })();

// Runs its child story across a service boundary (local context stripped, fresh runtime).
export const boundary = (storyFactory: () => AskResponse<any>): AskResponse<any> =>
  (function* () {
    return yield { type: BOUNDARY_ACTION, payload: { storyFactory } };
  })();

const buildRuntime = (callerSession: StorySession, getActionProcessors: ActionProcessorListResolver, dynamicModuleLoader: DynamicModuleLoader) =>
  createRuntime(
    RUNTIME_CONFIG,
    callerSession,
    getActionProcessors,
    getDateNow,
    silentLogger,
    'composition::run',
    QpqRuntimeType.EXECUTE_STORY,
    dynamicModuleLoader,
  );

const getTestActionProcessors: ActionProcessorListResolver = async (qpqConfig, dynamicModuleLoader): Promise<ActionProcessorList> => ({
  ...(await getCoreActionProcessor(qpqConfig, dynamicModuleLoader)),
  [ECHO_ACTION]: async (payload: { value: unknown }) => actionResult(payload.value),
  [FAIL_ACTION]: async (payload: { error: string }) => actionResultError(payload.error, payload.error),
  [BOUNDARY_ACTION]: async (
    payload: { storyFactory: () => AskResponse<any> },
    session,
    actionProcessors,
    logger,
    updateSession,
    dml,
    streamRegistry,
  ) => {
    // This is exactly what the real cross-service send/execute processors do: drop service-local
    // context, then resolve the sub-story in a fresh runtime that inherits the rest of the session.
    const crossServiceRuntime = createRuntime(
      RUNTIME_CONFIG,
      toCrossServiceSession(session),
      async () => actionProcessors,
      getDateNow,
      logger,
      'composition::boundary',
      QpqRuntimeType.EXECUTE_STORY,
      dml,
      undefined,
      [],
      streamRegistry,
    );

    const storyResult = await crossServiceRuntime(payload.storyFactory, []);
    if (storyResult.error) {
      return actionResultError(storyResult.error.errorType, storyResult.error.errorText);
    }
    return actionResult(storyResult.result);
  },
});

// Runs a story to completion through the real runtime and returns its StoryResult
// (`.result` on success, `.error` when a failure escaped to the top). console.log is
// silenced around the run: the runtime logs "Caught Error" on every expected error path,
// and the failure matrices exercise hundreds of them.
export const runComposition = async (storyFactory: () => AskResponse<any>): Promise<StoryResult<any>> => {
  const resolveStory = buildRuntime({ correlation: 'composition-root', depth: 0, context: {} }, getTestActionProcessors, async () => null);

  const originalConsoleLog = console.log;
  console.log = () => {};
  try {
    return await resolveStory(storyFactory, []);
  } finally {
    console.log = originalConsoleLog;
  }
};
