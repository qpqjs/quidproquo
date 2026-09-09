import { AskResponse } from 'quidproquo-core';

/** A bag of scope-blind domain verbs; bindEventDocWorkspaceApi maps over it preserving signatures. */
export type EventDocWorkspaceStoryApi = Record<string, (...args: any[]) => AskResponse<any>>;
