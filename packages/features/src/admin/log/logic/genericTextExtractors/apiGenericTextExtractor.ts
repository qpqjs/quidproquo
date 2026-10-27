import {
  ActionProcessorResult,
  EventActionType,
  isErroredActionResult,
  QpqRuntimeType,
  resolveActionResult,
  resolveActionResultError,
  StoryResult,
} from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

export const apiGenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.runtimeType === QpqRuntimeType.API) {
    const getRecordsHistory = storyResult.history.find((h) => h.act.type === EventActionType.GetRecords);

    if (!getRecordsHistory) {
      return [];
    }

    const actionResult: ActionProcessorResult<HTTPEvent[]> = getRecordsHistory.res;

    if (!isErroredActionResult(actionResult)) {
      const httpEvents = resolveActionResult(actionResult);
      return httpEvents.flatMap((event) => `${event.method}::${event.path} - [${event.sourceIp}]`);
    }

    return [resolveActionResultError(actionResult).errorText];
  }

  return [];
};
