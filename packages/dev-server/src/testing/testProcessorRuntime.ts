import { ActionProcessor, buildTestStorySession, DynamicModuleLoader, StorySession, StreamRegistry } from 'quidproquo-core';

// Invokes an action processor with throwaway runtime collaborators.
//
// The dev-server processors under test only read their payload (and, where relevant, their
// mocked dependencies), so the story session, sibling processors, logger, session updater,
// module loader and stream registry are all inert stubs. `session` can be overridden for
// the rare test that asserts on the correlation it carries.
export const invokeProcessor = (process: ActionProcessor<any>, payload: unknown, session: StorySession = buildTestStorySession()) =>
  process(
    payload as any,
    session,
    {},
    undefined as any,
    () => {},
    (() => null) as unknown as DynamicModuleLoader,
    undefined as unknown as StreamRegistry,
  );
