import { AskResponse } from './StorySession';

export type UnboundLogicStory<ApiDeps, Args extends any[], R> = (dependencies: ApiDeps, ...args: Args) => AskResponse<R>;
