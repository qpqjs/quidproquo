import { actionResult, actionResultError } from './logic/actionLogic';
import { QPQConfig } from './config';
import { createNestedRuntime, createRuntime } from './runtime';
import {
  ActionProcessor,
  ActionProcessorList,
  ActionProcessorListResolver,
  AnyStory,
  DynamicModuleLoader,
  QpqLogger,
  QpqRuntimeType,
  StorySession,
  StreamRegistry,
} from './types';

/** Creates the nested runtime for an implementation story (tool executor, drive file resolver, custom implementation) run inside the caller's story. */
export const createImplementationRuntime = (
  qpqConfig: QPQConfig,
  tags: string[],

  getDateNow: Parameters<typeof createRuntime>[3],
  randomGuid: () => string,

  session: StorySession,
  actionProcessors: ActionProcessorList,
  logger: QpqLogger,
  dynamicModuleLoader: DynamicModuleLoader,
  streamRegistry?: StreamRegistry,
): ReturnType<typeof createRuntime> =>
  createNestedRuntime(
    qpqConfig,
    session,
    actionProcessors,
    getDateNow,
    logger,
    randomGuid,
    QpqRuntimeType.EXECUTE_IMPLEMENTATION_STORY,
    dynamicModuleLoader,
    undefined,
    tags,
    streamRegistry,
  );

export const getProcessCustomImplementation = <T extends ActionProcessor<any, any>>(
  qpqConfig: QPQConfig,
  story: AnyStory,
  tag: string,
  actionProcessorListResolver: ActionProcessorListResolver | null,
  getDateNow: () => string,
  getNewGuid: () => string,
): T => {
  const actionProcesor: ActionProcessor<any, any> = async (
    payload,
    session,
    actionProcessorList,
    logger,
    updateSession,
    dynamicModuleLoader,
    streamRegistry,
  ) => {
    const resolveStory = createImplementationRuntime(
      qpqConfig,
      [tag],
      getDateNow,
      getNewGuid,
      session,
      {
        ...actionProcessorList,
        ...(actionProcessorListResolver ? await actionProcessorListResolver(qpqConfig, dynamicModuleLoader) : {}),
      },
      logger,
      dynamicModuleLoader,
      streamRegistry,
    );

    const storyResult = await resolveStory(story, [payload]);

    if (storyResult.error) {
      return actionResultError(storyResult.error.errorType, storyResult.error.errorText);
    }

    return actionResult(storyResult.result);
  };

  return actionProcesor as T;
};
