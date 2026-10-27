import { MatchStoryResult } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, RouteOptions } from 'quidproquo-webserver';

import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Externals - The ins and outs of the external event
export type EventInput = [APIGatewayEvent, Context];
export type EventOutput = APIGatewayProxyResult;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = HTTPEvent;
export type InternalEventOutput = HTTPEventResponse;

export type MatchResult = MatchStoryResult<Record<string, string>, RouteOptions>;
