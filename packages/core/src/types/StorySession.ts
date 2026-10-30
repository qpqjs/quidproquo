import { Action } from './Action';
import { QPQError } from './ErrorTypeEnum';
import { QpqContext } from './QpqContextIdentifier';
import { QpqFunctionRuntime } from './QpqFunctionRuntime';

export type DecodedAccessToken = {
  userId: string;
  username: string;
  // Unix timestamp (number of seconds since January 1, 1970 UTC).
  exp: number;
  roles?: string[];

  userDirectory: string;
  wasValid: boolean;
};

export type StorySession = {
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
};

export type StorySessionUpdater = (newSession: Partial<StorySession>) => void;

export type AskResponse<T> = Generator<Action<any>, T, any>;

export type Story<TArgs extends any[], R> = (...args: TArgs) => AskResponse<R>;
export type StoryResolver = <S extends Story<any, any>>(story: S) => (...args: Parameters<S>) => Promise<AskResponseReturnType<ReturnType<S>>>;

// Directly extracting the generator's return type for any given AskResponse.
// By applying AskResponseReturnType to an AskResponse, we can determine the
// precise type that the AskResponse generator returns, bypassing the complexities
// of its yield types. This is particularly useful in scenarios where the return type
// is distinct from the types of actions or values yielded by the generator, allowing
// for clear type inference and usage in TypeScript codebases.
export type AskResponseReturnType<T extends AskResponse<any>> = T extends Generator<any, infer R, any> ? R : never;

// Any generator function that returns an AskResponse
export type ActionHistory<P = any, R = any> = {
  act: Action<P>;
  res: R;
  startedAt: string;
  finishedAt: string;
};

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

export type qpqConsoleLog = {
  t: string;
  a: any[];
};

export type StoryResult<TArgs extends Array<any>, TResult = any> = {
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
};

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
