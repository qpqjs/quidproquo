import {
  ActionProcessorResult,
  EventActionType,
  isErroredActionResult,
  QpqRuntimeType,
  resolveActionResult,
  resolveActionResultError,
  StoryResult,
} from 'quidproquo-core';
import { SeoEvent } from 'quidproquo-webserver';

export const seoORGenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.runtimeType === QpqRuntimeType.EVENT_SEO_OR) {
    const getRecordsHistory = storyResult.history.find((h) => h.act.type === EventActionType.GetRecords);

    if (!getRecordsHistory) {
      return [];
    }

    const actionResult: ActionProcessorResult<SeoEvent[]> = getRecordsHistory.res;

    if (!isErroredActionResult(actionResult)) {
      const seoEvents = resolveActionResult(actionResult);
      return seoEvents.flatMap((event) => event.path || '');
    }

    return [resolveActionResultError(actionResult).errorText];
  }

  return [''];
};
