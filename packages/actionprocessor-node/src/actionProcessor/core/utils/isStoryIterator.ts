import { AskResponse, Nullable } from '@qpqjs/core';

/**
 * The member execution contract shared by dynamic functions and user scripts: a value
 * that is an iterable iterator (a sync generator, the shape of every qpq story) is
 * driven through the runtime as a logged sub-story; anything else is a plain result.
 */
export const isStoryIterator = (value: unknown): value is AskResponse<unknown> => {
  const candidate = value as Nullable<{ next?: unknown; [Symbol.iterator]?: unknown }>;

  return typeof candidate?.next === 'function' && typeof candidate?.[Symbol.iterator] === 'function';
};
