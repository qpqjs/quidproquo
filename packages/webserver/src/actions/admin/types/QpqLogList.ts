import { StoryResultMetadata } from '@qpqjs/core';

export type QpqLogList = {
  items: StoryResultMetadata[];
  nextPageKey?: string;
};
