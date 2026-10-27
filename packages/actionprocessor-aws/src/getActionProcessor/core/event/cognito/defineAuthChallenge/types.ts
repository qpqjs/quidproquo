import { DefineAuthChallengeEvent, DefineAuthChallengeEventResponse, MatchStoryResult } from 'quidproquo-core';

import { Context, DefineAuthChallengeTriggerEvent } from 'aws-lambda';

export const GLOBAL_USER_DIRECTORY_NAME = process.env.userDirectoryName!;

// Externals - The ins and outs of the external event
export type EventInput = [DefineAuthChallengeTriggerEvent, Context];
export type EventOutput = DefineAuthChallengeTriggerEvent;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = DefineAuthChallengeEvent;
export type InternalEventOutput = DefineAuthChallengeEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
