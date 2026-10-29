import { QpqFunctionRuntime } from '../../../types';

export type MatchStoryResult<MatchOptions, Config> = {
  runtime?: QpqFunctionRuntime;
  runtimeOptions?: MatchOptions;
  config?: Config;
};
