import {
  ActionProcessorResult,
  DeployEvent,
  EventActionType,
  isErroredActionResult,
  QpqRuntimeType,
  resolveActionResult,
  resolveActionResultError,
  StoryResult,
} from 'quidproquo-core';

export const deployEventGenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.runtimeType === QpqRuntimeType.DEPLOY_EVENT) {
    const getRecordsHistory = storyResult.history.find((h) => h.act.type === EventActionType.GetRecords);

    if (!getRecordsHistory) {
      return [];
    }

    const actionResult: ActionProcessorResult<DeployEvent[]> = getRecordsHistory.res;

    if (!isErroredActionResult(actionResult)) {
      const deployEvents = resolveActionResult(actionResult);
      return deployEvents.flatMap((event) => `${event.deployEventType}::${event.deployEventStatusType}`);
    }

    return [resolveActionResultError(actionResult).errorText];
  }

  return [''];
};
