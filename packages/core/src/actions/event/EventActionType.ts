import { QpqFunctionRuntime } from '../../types';

export enum EventActionType {
  GetRecords = '@quidproquo-core/Event/GetRecords',
  TransformEventRecord = '@quidproquo-core/event/TransformEventRecord',
  TransformEventRecordResponse = '@quidproquo-core/event/TransformEventRecordResponse',
  MatchStory = '@quidproquo-core/event/MatchStory',
  GetStorySession = '@quidproquo-core/event/GetStorySession',

  TransformEventParams = '@quidproquo-core/event/TransformEventParams',
  TransformResponseResult = '@quidproquo-core/event/TransformResponseResult',
  AutoRespond = '@quidproquo-core/event/AutoRespond',
  ResolveCaughtError = '@quidproquo-core/event/ResolveCaughtError',
}

export type MatchStoryResult<MatchOptions, Config> = {
  runtime?: QpqFunctionRuntime;
  runtimeOptions?: MatchOptions;
  config?: Config;
};

export type AnyMatchStoryResult = MatchStoryResult<any, any>;
