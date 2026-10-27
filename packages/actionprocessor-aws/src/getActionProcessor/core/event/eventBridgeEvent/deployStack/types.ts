import { DeployEvent, DeployEventResponse, MatchStoryResult } from 'quidproquo-core';

import { Context, EventBridgeEvent } from 'aws-lambda';

interface CloudFormationEventDetail {
  'stack-id': string;
  'status-details': {
    status: string;
    'status-reason': string;
  };
}

// Externals - The ins and outs of the external event
export type EventInput = [EventBridgeEvent<'CloudFormation Stack Status Change', CloudFormationEventDetail>, Context];
export type EventOutput = void;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = DeployEvent;
export type InternalEventOutput = DeployEventResponse;

// TODO: Get rid of any types
export type MatchResult = MatchStoryResult<any, any>;
