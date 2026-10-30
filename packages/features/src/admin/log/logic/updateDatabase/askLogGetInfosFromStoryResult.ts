import { AskResponse, decomposedStringToString, filterLogHistoryByActionTypes, LogActionType, LogLevelEnum, StoryResult } from '@qpqjs/core';

export function* askLogGetInfosFromStoryResult(result: StoryResult<any>): AskResponse<
  {
    logLevel: LogLevelEnum;
    msg: string;
    startedAt: string;
  }[]
> {
  const logActions = filterLogHistoryByActionTypes(result.history, [LogActionType.Create, LogActionType.TemplateLiteral]);

  return logActions.map((la) => {
    if (la.act.type === LogActionType.TemplateLiteral) {
      return {
        logLevel: LogLevelEnum.Info,
        msg: decomposedStringToString(la.act.payload?.messageParts),
        startedAt: la.startedAt,
      };
    }

    return {
      logLevel: la.act.payload?.logLevel ?? LogLevelEnum.Info,
      msg: la.act.payload?.msg ?? '',
      startedAt: la.startedAt,
    };
  });
}
