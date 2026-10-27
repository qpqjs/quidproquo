import { MatchStoryResult } from 'quidproquo-core';
import { SeoEvent, SeoEventResponse, SeoEventRouteParams, SeoQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { CloudFrontRequestEvent, CloudFrontRequestResult, Context } from 'aws-lambda';

// Externals - The ins and outs of the external event
export type EventInput = [CloudFrontRequestEvent, Context];
export type EventOutput = CloudFrontRequestResult;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = SeoEvent<any>;
export type InternalEventOutput = SeoEventResponse;

// Match result - the result of matching the event to a story
export type MatchResult = MatchStoryResult<SeoEventRouteParams, SeoQPQWebServerConfigSetting>;
