import { MatchStoryResult } from '@qpqjs/core';
import { HTTPEvent, HTTPEventResponse, HttpEventRouteParams, RouteOptions } from '@qpqjs/webserver';

import { ExpressEvent, ExpressEventResponse } from '../../../../../types/ExpressEvent';

// Externals - The ins and outs of the external event
/**
 *
 */
export type EventInput = [ExpressEvent];
/**
 *
 */
export type EventOutput = ExpressEventResponse;

// Internals - the ins and outs of each record in the event
/**
 *
 */
export type InternalEventRecord = HTTPEvent;
/**
 *
 */
export type InternalEventOutput = HTTPEventResponse;

/**
 *
 */
export type MatchResult = MatchStoryResult<HttpEventRouteParams, RouteOptions>;
