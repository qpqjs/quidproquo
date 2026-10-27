import { QPQConfig } from '../config';
import { QpqFunctionRuntime, QpqLogger, StreamRegistry } from '../types';
import { ActionProcessorList } from '../types/Action';
import { qpqConsoleLog, QpqRuntimeType, Story, StoryResult, StorySession, StorySessionUpdater } from '../types/StorySession';
import { resolveStory } from './resolveStory';

// Stories run concurrently in one process (overlapping requests, nested runtimes for
// AI tools / file resolvers), so a per-story `old = console.log; ...; console.log = old`
// interleaves badly: the outer story's restore clobbers the inner story's patch, and the
// inner story's restore then reinstalls the outer story's wrapper — leaking one wrapper
// per overlap until console.log is a chain deep enough to blow the stack. Instead, keep
// ONE global patch with a stack of active collectors; every active story captures every
// log (same semantics as the chained wrappers), and the true original is restored only
// when the last story finishes.
type ConsoleLogCollector = { logs: qpqConsoleLog[]; getTimeNow: () => string };

let activeLogCollectors: ConsoleLogCollector[] = [];
let unpatchedConsoleLog: typeof console.log | null = null;

const pushLogCollector = (collector: ConsoleLogCollector): void => {
  if (unpatchedConsoleLog === null) {
    const original = console.log;
    unpatchedConsoleLog = original;
    console.log = (...args: any[]) => {
      for (const active of activeLogCollectors) {
        active.logs.push({ t: active.getTimeNow(), a: args });
      }
      return original(...args);
    };
  }

  activeLogCollectors.push(collector);
};

const popLogCollector = (collector: ConsoleLogCollector): void => {
  activeLogCollectors = activeLogCollectors.filter((active) => active !== collector);

  if (activeLogCollectors.length === 0 && unpatchedConsoleLog !== null) {
    console.log = unpatchedConsoleLog;
    unpatchedConsoleLog = null;
  }
};

export async function resolveStoryWithLogs<TArgs extends Array<any>>(
  story: Story<TArgs, any>,
  args: TArgs,
  qpqConfig: QPQConfig,
  callerSession: StorySession,
  getActionProcessors: (config: QPQConfig, dynamicModuleLoader: any) => Promise<ActionProcessorList>,
  getTimeNow: () => string,
  logger: QpqLogger,
  runtimeCorrelation: string,
  runtimeType: QpqRuntimeType,
  dynamicModuleLoader: any,
  qpqFunctionRuntimeInfo?: QpqFunctionRuntime,
  initialTags?: string[],
  streamRegistry?: StreamRegistry,
): Promise<StoryResult<any>> {
  const collector: ConsoleLogCollector = { logs: [], getTimeNow };

  try {
    pushLogCollector(collector);

    const storyResult = await resolveStory(
      story,
      args,
      qpqConfig,
      callerSession,
      getActionProcessors,
      getTimeNow,
      logger,
      runtimeCorrelation,
      runtimeType,
      dynamicModuleLoader,
      qpqFunctionRuntimeInfo,
      initialTags,
      streamRegistry,
    );

    storyResult.logs = collector.logs;
    logger.log(storyResult);
    return storyResult;
  } finally {
    popLogCollector(collector);
  }
}
