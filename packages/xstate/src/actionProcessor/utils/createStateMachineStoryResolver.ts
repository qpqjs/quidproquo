import {
  ActionProcessorList,
  createImplementationRuntime,
  DynamicModuleLoader,
  generateUuid,
  getDateNow,
  QPQConfig,
  QpqLogger,
  StorySession,
  StreamRegistry,
} from '@qpqjs/core';

/** Resolves a story to a StoryResult; every state machine processor runs its KVS, guard and side-effect stories through one. */
export type StateMachineStoryResolver = ReturnType<typeof createImplementationRuntime>;

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
  createImplementationRuntime(qpqConfig, [tag], getDateNow, generateUuid, session, actionProcessors, logger, dynamicModuleLoader, streamRegistry);
