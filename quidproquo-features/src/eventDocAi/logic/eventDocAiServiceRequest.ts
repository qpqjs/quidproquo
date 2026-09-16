import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { EVENT_DOC_TYPE_GLOBAL } from '../../eventDoc';
import { askEventDocResolveActor } from '../../eventDoc';
import { serviceRequest, ServiceRequestDeferred, ServiceRequester } from '../../webSocketQueue/logic/service';
import { EVENT_DOC_AI_SERVICE_NAME_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiDocRef } from '../models';
import { askEventDocAiContextProvide } from '../module';

type PayloadOf<R> = R extends ServiceRequester<infer T, any> ? T : never;
type ResponseOf<R> = R extends ServiceRequester<any, infer T> ? T : never;

// The eventDocAi handler wrapper (mirrors mincept's minceptServiceRequest):
// gates on connection auth, strips the relayed docId off the wire payload and
// re-provides the doc context (serviceName/type from the processor globals +
// docId) around the handler — so handlers, nested logic, and TOOL RUNTIMES
// (which inherit the session context) all read the trusted docId from context
// rather than from anything the caller or the model could fabricate.
export const eventDocAiServiceRequest = <R extends ServiceRequester<any, any>>(
  requester: R,
  runtime: (payload: PayloadOf<R>) => AskResponse<ResponseOf<R> | ServiceRequestDeferred>,
) =>
  serviceRequest(requester, function* askEventDocAiServiceHandler(wirePayload: PayloadOf<R> & EventDocAiDocRef) {
    yield* askEventDocResolveActor();

    const { docId, ...payload } = wirePayload;

    const serviceName = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_SERVICE_NAME_GLOBAL);
    const type = yield* askConfigGetGlobal<string>(EVENT_DOC_TYPE_GLOBAL);

    return yield* askEventDocAiContextProvide({ serviceName, type, docId }, runtime(payload as PayloadOf<R>));
  } as (payload: PayloadOf<R>) => AskResponse<ResponseOf<R> | ServiceRequestDeferred>);
