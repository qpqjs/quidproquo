import { askContextProvideValue } from '../../stories';
import { AskResponse, AskResponseReturnType, QpqContextIdentifier } from '../../types';

export function createContextProvider<R, Args extends any[]>(contextIdentifier: QpqContextIdentifier<R>, valueMapper: (...args: Args) => R) {
  return function* askContextProvideWrapper<T extends AskResponse<any>>(
    ...args: [...args: Args, storyItter: T]
  ): AskResponse<AskResponseReturnType<T>> {
    // Destructure the last argument as `storyItter`, leaving the rest in `restArgs`.
    const storyItter = args[args.length - 1];
    const restArgs = args.slice(0, -1);

    const value = valueMapper(...(restArgs as unknown as Args));
    return yield* askContextProvideValue(contextIdentifier, value, storyItter);
  };
}
