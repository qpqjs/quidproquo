import { ActionProcessor, ActionProcessorList, ActionProcessorListResolver } from '../types/Action';
import { QpqLogger } from '../types/QpqLogger';
import { StorySession } from '../types/StorySession';

// ─── Runtime testing toolkit ───────────────────────────────────────────────────
//
// The story-execution engine (processAction → resolveStory → resolveStoryWithLogs →
// createRuntime) needs a fistful of collaborators before it will run: a logger, a caller
// session, a clock, a guid source, a module loader, and a map of action processors. None
// of them are interesting to any single test, so they are gathered here as tiny, explicit
// fixtures. Tests then read as "here is the one processor I care about" plus an invoke.
//
//   const logger = createStubLogger(vi.fn());
//   const result = await resolveStory(story, [], buildTestQpqConfig(), buildTestStorySession(),
//     buildActionProcessorResolver({ [MyType]: async () => actionResult('ok') }),
//     getTestTimeNow, logger, 'corr-1', QpqRuntimeType.UNIT_TEST, noopDynamicModuleLoader);

// A fixed clock. resolveStory stamps startedAt/finishedAt/history with getTimeNow(), so a
// constant makes those fields deterministic and assertable.
export const TEST_TIME_NOW = '2024-01-01T00:00:00.000Z';
export const getTestTimeNow = (): string => TEST_TIME_NOW;

// A deterministic guid source for correlation building (`moduleName::guid`).
export const testRandomGuid = (): string => 'guid-0';

// A dynamic module loader that never resolves a module — enough for stories that do not
// dynamically load anything.
export const noopDynamicModuleLoader = async (): Promise<null> => null;

// The base caller session every runtime needs. resolveStory derives the story session from
// it (depth + 1, inherited context/correlation), so overriding `depth` here drives the
// depth-limit branch.
export const buildTestStorySession = (overrides: Partial<StorySession> = {}): StorySession => ({
  correlation: 'corr-0',
  depth: 0,
  context: {},
  ...overrides,
});

// A QpqLogger whose async lifecycle hooks are no-ops. `log` is injectable so a test can
// pass a spy (e.g. `vi.fn()`) and assert resolveStoryWithLogs called it with the result.
export const createStubLogger = (log: QpqLogger['log'] = () => {}): QpqLogger => ({
  enableLogs: async () => {},
  log,
  waitToFinishWriting: async () => {},
  moveToPermanentStorage: async () => {},
});

// Builds an ActionProcessorList from a plain `actionType -> processor` map. Identity with a
// type anchor, so call sites stay terse and well-typed.
export const buildActionProcessorList = (processors: Record<string, ActionProcessor<any, any>>): ActionProcessorList => ({
  ...processors,
});

// Wraps a processor map (or a plain map) in the resolver shape resolveStory/createRuntime
// expect: an async function ignoring its (config, loader) args and returning the list.
export const buildActionProcessorResolver =
  (processors: Record<string, ActionProcessor<any, any>>): ActionProcessorListResolver =>
  async () =>
    buildActionProcessorList(processors);
