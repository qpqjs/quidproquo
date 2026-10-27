import { StorySession } from 'quidproquo-core';

/**
 * The root story session for lambdas whose triggering event carries no session
 * of its own (api gateway, cognito triggers, schedules, s3/sqs events, ...).
 */
export const getBlankStorySession = (): StorySession => ({
  depth: 0,
  context: {},
});
