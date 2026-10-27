import { Action, ActionProcessor } from './Action';
import { AskResponse } from './StorySession';

// What createActionRequester takes: the single source of truth for an action.
// getPayload is omitted for payload-less actions; errorTypes lists every error the
// action's processors are allowed to produce (the full catalog, commented per entry).
export type ActionRequesterDefinition<TType extends string, TArgs extends unknown[], TPayload, TErrorTypes extends string> = {
  actionType: TType;
  errorTypes?: TErrorTypes[];
  getPayload?: (...args: TArgs) => TPayload;
};

// A requester built by createActionRequester: a callable ask* generator function that
// also carries its action type, payload builder and error enum as runtime metadata,
// so processor factories and tests can key off the requester itself instead of a type
// string. The call signature returns plain AskResponse<TReturn> to keep editor
// signature help short; ActionOf recovers the precise action shape from the metadata.
export type ActionRequesterFunction<TType extends string, TArgs extends unknown[], TPayload, TReturn, TErrorTypes extends string = never> = {
  (...args: TArgs): AskResponse<TReturn>;
  actionType: TType;
  getPayload: (...args: TArgs) => TPayload;
  errorType: { [K in TErrorTypes]: string };
};

// any[] not unknown[]: strict function variance rejects a requester's specific arg
// tuple against unknown[], and this alias only exists as a generic constraint.
export type AnyActionRequesterFunction = ActionRequesterFunction<string, any[], any, any, string>;

export type ActionOf<TRequester extends AnyActionRequesterFunction> = TRequester extends {
  actionType: infer TType extends string;
  getPayload: (...args: any[]) => infer TPayload;
}
  ? Action<TPayload> & { type: TType; payload: TPayload }
  : never;

export type ActionReturnOf<TRequester extends AnyActionRequesterFunction> =
  ReturnType<TRequester> extends Generator<any, infer TReturn, any> ? TReturn : never;

export type ProcessorFor<TRequester extends AnyActionRequesterFunction> = ActionProcessor<ActionOf<TRequester>, ActionReturnOf<TRequester>>;
