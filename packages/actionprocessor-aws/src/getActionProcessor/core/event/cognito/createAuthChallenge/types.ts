import { CreateAuthChallengeEvent, CreateAuthChallengeEventResponse, MatchStoryResult } from 'quidproquo-core';

import { Context, CreateAuthChallengeTriggerEvent } from 'aws-lambda';

export const GLOBAL_USER_DIRECTORY_NAME = process.env.userDirectoryName!;

// Externals - The ins and outs of the external event
export type EventInput = [CreateAuthChallengeTriggerEvent, Context];
export type EventOutput = CreateAuthChallengeTriggerEvent;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = CreateAuthChallengeEvent;
export type InternalEventOutput = CreateAuthChallengeEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
