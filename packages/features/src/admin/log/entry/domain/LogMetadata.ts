import { StoryResultMetadata } from '@qpqjs/core';

export type LogMetadata = StoryResultMetadata & {
  ttl?: number;

  checked?: boolean;
  checkedBy?: string;
};
