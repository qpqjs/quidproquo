import { StoryResultMetadata } from 'quidproquo-core';

export type LogMetadata = StoryResultMetadata & {
  ttl?: number;

  checked?: boolean;
  checkedBy?: string;
};
