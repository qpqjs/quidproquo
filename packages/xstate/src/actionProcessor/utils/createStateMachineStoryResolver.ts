import {
  ActionProcessorList,
  createImplementationRuntime,
  DynamicModuleLoader,
  QPQConfig,
  QpqLogger,
  StorySession,
  StreamRegistry,
} from 'quidproquo-core';

/** Resolves a story to a StoryResult; every state machine processor runs its KVS, guard and side-effect stories through one. */
export type StateMachineStoryResolver = ReturnType<typeof createImplementationRuntime>;

// Processors are platform code: wall-clock time is allowed here, stories stay
// deterministic because they receive time through actions.
const getDateNow = (): string => new Date().toISOString();

// Runtime correlation ids only need uniqueness within logs, not crypto randomness.
const getNewGuid = (): string => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Builds the shared implementation runtime the state machine processors resolve stories with. */
export const createStateMachineStoryResolver = (
  tag: string,
  qpqConfig: QPQConfig,
  session: StorySession,
  actionProcessors: ActionProcessorList,
  logger: QpqLogger,
  dynamicModuleLoader: DynamicModuleLoader,
  streamRegistry: StreamRegistry,
): StateMachineStoryResolver =>
  createImplementationRuntime(qpqConfig, [tag], getDateNow, getNewGuid, session, actionProcessors, logger, dynamicModuleLoader, streamRegistry);
