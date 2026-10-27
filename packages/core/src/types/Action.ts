import { QPQConfig } from '../config';
import { DynamicModuleLoader } from './DynamicModuleLoader';
import { QPQError } from './ErrorTypeEnum';
import { QpqContext } from './QpqContextIdentifier';
import { QpqLogger } from './QpqLogger';
import { ExtractGeneratorReturnType, StoryResult, StorySession, StorySessionUpdater } from './StorySession';
import { StreamRegistry } from './StreamRegistry';

// Action ~ Think redux action
// They must have a type, and an optional payload
export interface Action<T> {
  type: string;
  payload?: T;

  returnErrors?: boolean;
  context?: QpqContext<any>;
  localContext?: QpqContext<any>;
}

// Result tuple ~ Either result or error
export type ActionProcessorResult<T> = [T?, QPQError?];

export type AsyncActionProcessorResult<T> = Promise<ActionProcessorResult<T>>;

// Action result ~ Either result or error
export type EitherActionResult<T> =
  | {
      success: true;
      result: T;
      error?: never;
    }
  | {
      success: false;
      result?: never;
      error: QPQError;
    };

// A function type ~ Processes an action and returns an ActionProcessorResult
export type ActionProcessor<TAction extends Action<any>, TReturn = any> = (
  payload: TAction['payload'],
  session: StorySession,
  actionProcessors: ActionProcessorList,
  logger: QpqLogger,
  updateSession: StorySessionUpdater,
  dynamicModuleLoader: DynamicModuleLoader,
  streamRegistry: StreamRegistry,
) => AsyncActionProcessorResult<TReturn>;

// Generator<
//  Thing you are giving to QPQ,
//  Thing the function returns to the regular logic,
//  the thing QPQ gives us
// >
export type ActionRequester<TAction extends Action<any>, TReturn = undefined, TQPQReturn = TReturn> = Generator<TAction, TReturn, TQPQReturn>;

export type ActionProcessorReturnType<T extends Generator<any, any, any>> = ExtractGeneratorReturnType<T>;

export type ActionProcessorList = {
  [key: string]: ActionProcessor<any, any>;
};

export type ActionProcessorListResolver = (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader) => Promise<ActionProcessorList>;

export type AnyStory<TArgs extends Array<any> = Array<any>> = (...args: TArgs) => ActionRequester<Action<any>, any, any>;
