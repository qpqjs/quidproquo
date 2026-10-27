import { ContextActionType } from '../actions/context/ContextActionType';
import { askThrowError } from '../actions/error/askThrowError';
import { ErrorActionType } from '../actions/error/ErrorActionType';
import { SystemActionType } from '../actions/system/SystemActionType';
import { ActionOverrideMap, askOverrideActions, getSuccessfulEitherActionResultIfRequired } from '../stories/system/askOverrideActions';
import { Action, AskResponse, AskResponseReturnType, EitherActionResult, QPQError } from '../types';

// ─── Story testing toolkit ─────────────────────────────────────────────────────
//
// Stories are generators that `yield*` actions and receive their results back. To unit
// test one in isolation we need to stand in for the runtime and answer every action it
// asks for. `askOverrideActions` is the production machinery that intercepts actions, so
// we build the mocking layer on top of it: a mock map becomes an override map, and a tiny
// driver runs the wrapped story to completion.
//
// The result: tests read as a few lines of mocks, an invoke, and a list of expectations.
//
//   const result = runStory(askThing('id'), {
//     [KeyValueStoreActionType.Get]: { id: 'id', name: 'mock' },
//     [DateActionType.Now]: (action) => 1000,
//   });

// A mock for a single action type. Either the raw value the action resolves to, or a
// function of the action that computes it (handy for asserting on / varying by payload).
// `returnErrors` wrapping (added by askCatch) is applied for you — always supply the
// plain success value.
export type ActionMock<TAction extends Action<any> = Action<any>, TResult = any> = TResult | ((action: TAction) => TResult);

// Maps action types (or '*' for a catch-all) to their mocks.
export type ActionMockMap = Record<string, ActionMock>;

// Sentinel produced by `throwsError` so a mock can simulate an action that fails.
interface MockedActionError {
  readonly __qpqMockError: true;
  readonly errorType: string;
  readonly errorText: string;
  readonly errorStack?: string;
}

const isMockedActionError = (value: unknown): value is MockedActionError =>
  typeof value === 'object' && value !== null && (value as MockedActionError).__qpqMockError === true;

// Use as a mock value to make an action fail. Under askCatch the failure comes back as an
// EitherActionResult; otherwise it propagates as a thrown StoryError.
export const throwsError = (errorType: string, errorText: string, errorStack?: string): MockedActionError => ({
  __qpqMockError: true,
  errorType,
  errorText,
  errorStack,
});

// A real story error that escaped to the runtime (an uncaught askThrowError). Carries the
// QPQ error fields so tests can assert on them.
export class StoryError extends Error {
  constructor(
    public readonly errorType: string,
    public readonly errorText: string,
    public readonly errorStack?: string,
  ) {
    super(`${errorType}: ${errorText}`);
    this.name = 'StoryError';
  }
}

// Turns a friendly mock map into the ActionOverrideMap askOverrideActions consumes. Each
// handler shapes its value for returnErrors and translates `throwsError` sentinels.
export const mockActions = (mocks: ActionMockMap): ActionOverrideMap =>
  Object.fromEntries(
    Object.entries(mocks).map(([actionType, mock]) => [
      actionType,
      function* handler(action: Action<any>) {
        const value = typeof mock === 'function' ? mock(action) : mock;

        if (isMockedActionError(value)) {
          if (action.returnErrors) {
            return { success: false, error: { errorType: value.errorType, errorText: value.errorText, errorStack: value.errorStack } };
          }
          return yield* askThrowError(value.errorType, value.errorText, value.errorStack);
        }

        return getSuccessfulEitherActionResultIfRequired(value, action.returnErrors);
      },
    ]),
  );

// Drives a story (already wrapped by askOverrideActions) to completion. Every real action
// should be mocked, so anything that reaches the runtime is a test gap and throws — except
// the empty batch askOverrideActions emits internally, which we answer with [].
const drive = <R>(story: AskResponse<R>): R => {
  let next = story.next();

  while (!next.done) {
    const action = next.value;

    if (action.type === SystemActionType.Batch) {
      const subActions: Action<any>[] = action.payload?.actions ?? [];
      if (subActions.length === 0) {
        next = story.next(getSuccessfulEitherActionResultIfRequired([], action.returnErrors));
        continue;
      }
      throw new StoryError('TestSetupError', `Unmocked action(s) in batch: ${subActions.map((a) => a.type).join(', ')}. Add them to your mocks.`);
    }

    if (action.type === ErrorActionType.ThrowError) {
      const { errorType, errorText, errorStack } = action.payload;
      if (action.returnErrors) {
        next = story.next({ success: false, error: { errorType, errorText, errorStack } });
        continue;
      }
      throw new StoryError(errorType, errorText, errorStack);
    }

    // An unprovided, unmocked context read resolves to the identifier's default,
    // exactly what the production context processor does when nothing provided a
    // value. A mock or an askContextProvideValue wrapper still takes precedence
    // (both intercept before the action reaches the runtime).
    if (action.type === ContextActionType.Read) {
      next = story.next(getSuccessfulEitherActionResultIfRequired(action.payload?.contextIdentifier?.defaultValue, action.returnErrors));
      continue;
    }

    throw new StoryError('TestSetupError', `Unmocked action reached the runtime: "${action.type}". Add it to your mocks.`);
  }

  return next.value;
};

// Runs a story with the given action mocks and returns its resolved value. An uncaught
// story error (askThrowError) surfaces as a thrown StoryError.
export function runStory<T extends AskResponse<any>>(story: T, mocks: ActionMockMap = {}): AskResponseReturnType<T> {
  return drive(askOverrideActions(story, mockActions(mocks))) as AskResponseReturnType<T>;
}

// Narrows a captured EitherActionResult (e.g. from askCatch) to its value, failing the
// test loudly if it was actually an error.
export function expectSuccess<T>(result: EitherActionResult<T>): T {
  if (!result.success) {
    throw new Error(`Expected a successful result but got error: ${JSON.stringify(result.error)}`);
  }
  return result.result;
}

// Narrows a captured EitherActionResult to its error, failing the test loudly if it
// actually succeeded.
export function expectError(result: EitherActionResult<any>): QPQError {
  if (result.success) {
    throw new Error(`Expected a failed result but got success: ${JSON.stringify(result.result)}`);
  }
  return result.error;
}
