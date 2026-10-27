import { Action, AskResponse, AskResponseReturnType } from '../types';

// ─── Requester testing helper ───────────────────────────────────────────────────
//
// Action requesters are the simplest stories: they `yield` exactly one action and
// `return` whatever the runtime answers with. Testing one means checking two things —
// the shape of the action it yields, and that the runtime's response passes straight
// through. `captureRequester` drives that single round-trip and hands both back.
//
//   const { action, returned } = captureRequester(askConfigGetParameter('name'), 'value');
//   expect(action).toEqual({ type: ConfigActionType.GetParameter, payload: { parameterName: 'name' } });
//   expect(returned).toBe('value');

export interface CapturedRequester<T> {
  // The action the requester yielded.
  readonly action: Action<any>;
  // The value the requester returned after the runtime answered with `result`.
  readonly returned: T;
}

// Runs a single-action requester: pulls the one action it yields, answers with `result`,
// and captures the value it returns. Throws if the requester yields nothing or yields
// more than once — either means it is not a plain requester and wants a different helper.
export function captureRequester<T extends AskResponse<any>>(requester: T, result?: unknown): CapturedRequester<AskResponseReturnType<T>> {
  const first = requester.next();
  if (first.done) {
    throw new Error('Expected the requester to yield an action, but it returned immediately.');
  }

  const second = requester.next(result);
  if (!second.done) {
    throw new Error('Expected the requester to complete after a single action, but it yielded again.');
  }

  return { action: first.value as Action<any>, returned: second.value as AskResponseReturnType<T> };
}
