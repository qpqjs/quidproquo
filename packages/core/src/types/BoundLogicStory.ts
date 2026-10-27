import { AskResponse } from './StorySession';

export type BoundLogicStory<Func> = Func extends (arg: any, ...args: infer Args) => AskResponse<infer R> ? (...args: Args) => AskResponse<R> : never;
