import { Action } from './Action';
import { QPQError } from './ErrorTypeEnum';
import { QpqContext } from './QpqContextIdentifier';
import { QpqFunctionRuntime } from './QpqFunctionRuntime';

export interface DecodedAccessToken {
  userId: string;
  username: string;
  // Unix timestamp (number of seconds since January 1, 1970 UTC).
  exp: number;
  roles?: string[];

  userDirectory: string;
  wasValid: boolean;
}

export interface StorySession {
  correlation?: string;
  depth: number;

  // This token is never transfer cross storys
  // can't access it via events or anything
  accessToken?: string;

  // Decoded access token + roles token
  decodedAccessToken?: DecodedAccessToken;

  // Context
  context: QpqContext<any>;

  // Service-local context, this is never transferred across a service boundary
  // (queue / event bus / service function), but does flow to in-process sub-runtimes.
  localContext?: QpqContext<any>;

  // Globals declared on the executing function's QpqFunctionRuntimeAdvanced.
  // Set per-runtime from qpqFunctionRuntimeInfo. In-process nested runs also inherit the
  // caller's (their own win on collision); transport entries (http/queue/ws) never do.
  functionGlobals?: Record<string, unknown>;
}

export type StorySessionUpdater = (newSession: Partial<StorySession>) => void;

export type AskResponse<T> = Generator<Action<any>, T, any>;

export type Story<TArgs extends any[], R> = (...args: TArgs) => AskResponse<R>;
export type StoryResolver = <S extends Story<any, any>>(story: S) => (...args: Parameters<S>) => Promise<AskResponseReturnType<ReturnType<S>>>;

// function* test(msg: string): AskResponse<number> {
//   return parseInt(msg);
// }

// function DoThing<S extends Story<any, any>>(story: S): (...args: Parameters<S>) => AskResponseReturnType<ReturnType<S>> {
//   return (...args: Parameters<S>) => {
//     return (() => {}) as any;
//   };
// }

// const runTest = DoThing(test);
// const num = runTest('a');

/**
 * Utility Type: ExtractGeneratorReturnType
 *
 * This utility type is designed to extract the return type of a Generator without
 * conflating it with the types of values it may yield. Generators in TypeScript are
 * annotated as Generator<YieldType, ReturnType, NextType>, where YieldType is the
 * type of values yielded by the generator, ReturnType is the type the generator returns
 * when it's done, and NextType is the type of the value passed to the generator's `next` method.
 *
 * By leveraging TypeScript's conditional types and the `infer` keyword, ExtractGeneratorReturnType
 * can precisely capture and extract just the ReturnType of any given Generator, providing a clean,
 * type-safe way to understand what a generator ultimately returns upon completion.
 *
 * Usage of `infer` in Conditional Types:
 * The `infer` keyword is used here to declare a type variable R within the conditional type
 * expression. TypeScript will then infer the type R as the generator's ReturnType when the
 * condition `T extends Generator<any, infer R, any>` is met. This inference is based on the
 * actual type passed to ExtractGeneratorReturnType, allowing us to "pull out" the ReturnType
 * from within the Generator type.
 *
 * This approach is particularly useful because it directly targets the ReturnType without
 * having to manually sift through or exclude the types of values that might be yielded by
 * the generator, which can often be diverse and not relevant to the final return type we're
 * interested in capturing.
 *
 * The ExtractGeneratorReturnType utility type simplifies the extraction process and ensures
 * that types dependent on the return value of generators are accurately typed, enhancing
 * code readability and maintainability.
 */

export type ExtractGeneratorReturnType<T extends Generator> = T extends Generator<any, infer R, any> ? R : never;

// Directly extracting the generator's return type for any given AskResponse.
// By applying ExtractGeneratorReturnType to an AskResponse, we can determine the
// precise type that the AskResponse generator returns, bypassing the complexities
// of its yield types. This is particularly useful in scenarios where the return type
// is distinct from the types of actions or values yielded by the generator, allowing
// for clear type inference and usage in TypeScript codebases.
export type AskResponseReturnType<T extends AskResponse<any>> = ExtractGeneratorReturnType<T>;

// Any generator function that returns an AskResponse
// qpq runtimes are built on stories
export type qpqStory = <T = any>(...args: any[]) => AskResponse<T>;

export interface ActionHistory<P = any, R = any> {
  act: Action<P>;
  res: R;
  startedAt: string;
  finishedAt: string;
}

export enum QpqRuntimeType {
  API = 'API',
  EXECUTE_STORY = 'EXECUTE_STORY',
  EXECUTE_IMPLEMENTATION_STORY = 'EXECUTE_IMPLEMENTATION_STORY',
  RECURRING_SCHEDULE = 'RECURRING_SCHEDULE',
  QUEUE_EVENT = 'QUEUE_EVENT',
  EVENT_SEO_OR = 'EVENT_SEO_OR',
  SERVICE_FUNCTION_EXE = 'SERVICE_FUNCTION_EXE',
  WEBSOCKET_EVENT = 'WEBSOCKET_EVENT',
  DEPLOY_EVENT = 'DEPLOY_EVENT',
  STORAGEDRIVE_EVENT = 'STORAGEDRIVE_EVENT',
  KVS_STREAM_EVENT = 'KVS_STREAM_EVENT',
  CLOUD_FLARE_DEPLOY = 'CLOUD_FLARE_DEPLOY',

  UNIT_TEST = 'UNIT_TEST',
  UI = 'UI',

  SEND_EMAIL_EVENT = 'SEND_EMAIL_EVENT',

  AUTH_DEFINE_AUTH_CHALLENGE = 'AUTH_DEFINE_AUTH_CHALLENGE',
  AUTH_CREATE_AUTH_CHALLENGE = 'AUTH_CREATE_AUTH_CHALLENGE',
  AUTH_VERIFY_AUTH_CHALLENGE = 'AUTH_VERIFY_AUTH_CHALLENGE',
}

export interface qpqConsoleLog {
  t: string;
  a: any[];
}

export interface StoryResult<TArgs extends Array<any>, TResult = any> {
  // Params to story
  input: TArgs;

  // Story Session Data
  session: StorySession;

  // History of actions
  history: ActionHistory[];

  // When the story started / finished
  startedAt: string;
  finishedAt: string;

  // correlationGuid from the calling story
  fromCorrelation?: string;

  // correlation for this story (correlates all actions together)
  correlation: string;

  // For logging, tags to help identify the story
  tags: string[];
  moduleName: string;

  // Result of the story result or error not both
  result?: TResult;
  error?: QPQError;

  // User specified runtime type
  runtimeType: QpqRuntimeType;

  // Impure Logs
  logs?: qpqConsoleLog[];

  // What was the function runtime that this was executed against
  qpqFunctionRuntimeInfo?: QpqFunctionRuntime;
}

export type StoryResultMetadata = {
  correlation: string;
  fromCorrelation?: string;

  moduleName: string;
  runtimeType: QpqRuntimeType;

  startedAt: string;

  generic: string;

  error?: string;

  executionTimeMs: number;

  userInfo?: string;

  qpqFunctionRuntimeInfo?: QpqFunctionRuntime;
};

export type StoryResultMetadataWithChildren = StoryResultMetadata & {
  children: StoryResultMetadataWithChildren[];
};
