import { QueueMessage, StorySession } from '@qpqjs/core';

export type AnyEventBusMessageWithSession = QueueMessage<any> & {
  storySession: StorySession;

  eventBusName: string;

  targetApplication: string;
  targetEnvironment: string;
  targetModule: string;
  targetFeature?: string;
};
