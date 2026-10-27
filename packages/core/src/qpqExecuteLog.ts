import { defineApplicationModule, QPQConfig } from './config';
import { createRuntime } from './runtime';
import { ActionProcessorList, StoryResult } from './types';

export const createDebugLogActionProcessor = (storyResult: StoryResult<any>, overrides: ActionProcessorList = {}) => {
  return async (qpqConfig: QPQConfig): Promise<ActionProcessorList> => {
    let logIndex = 0;
    const storyActionProcessor: ActionProcessorList = new Proxy(
      {},
      {
        get: (target: any, property: any) => {
          // This gets called by children async functions, which unwraps promises, so we need to return nothing for a then...
          if (property === 'then') {
            return undefined;
          }

          if (overrides[property]) {
            return overrides[property];
          }

          return async () => {
            const res = storyResult.history[logIndex]?.res;
            logIndex = logIndex + 1;
            return res;
          };
        },
      },
    );

    return storyActionProcessor;
  };
};

export const qpqExecuteLog = async (storyResult: StoryResult<any>, runtime: any, overrides: ActionProcessorList = {}): Promise<StoryResult<any>> => {
  // Generate an empty story resolver
  const resolveStory = createRuntime(
    [defineApplicationModule('Debugger', storyResult.moduleName, 'development', __dirname, './dist')],
    {
      correlation: storyResult.fromCorrelation,
      depth: storyResult.session.depth,
      context: storyResult.session.context,
    },
    createDebugLogActionProcessor(storyResult, overrides),
    () => new Date().toISOString(),
    {
      enableLogs: async () => {},
      log: async () => {},
      waitToFinishWriting: async () => {},
      moveToPermanentStorage: async () => {},
    },
    storyResult.correlation,
    storyResult.runtimeType,
    async () => null,
    storyResult.qpqFunctionRuntimeInfo,
  );

  // Execute it with the initial input
  // We use a debugger here to catch code before it is executed
  // eslint-disable-next-line no-debugger
  debugger;
  const result = await resolveStory(runtime, storyResult.input);

  return result;
};
