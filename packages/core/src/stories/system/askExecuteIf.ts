import { AskResponse, AskResponseReturnType, EitherActionResult, ErrorTypeEnum } from '../../types';

export function* askExecuteIf<T extends AskResponse<any>>(
  storyIterator: T | boolean,
  condition: boolean = true,
): AskResponse<AskResponseReturnType<T> | undefined> {
  if (condition && !!storyIterator && typeof storyIterator === 'object') {
    return yield* storyIterator;
  }

  return undefined;
}
