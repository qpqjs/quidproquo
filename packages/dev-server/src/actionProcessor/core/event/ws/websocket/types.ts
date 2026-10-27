import { MatchStoryResult } from 'quidproquo-core';
import { WebsocketEvent, WebsocketEventResponse } from 'quidproquo-webserver';

// Deep import (not the implementations/webSocket barrel): that barrel exports
// webSocketImplementation, which imports these websocket processors back — going
// through it would close an import cycle. The type file itself is leaf-only.
import { WsEvent } from '../../../../../implementations/webSocket/types/WsEvent';

// Externals - The ins and outs of the external event
export type EventInput = [WsEvent];
export type EventOutput = void;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = WebsocketEvent<string | Blob | ArrayBuffer>;
export type InternalEventOutput = WebsocketEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
