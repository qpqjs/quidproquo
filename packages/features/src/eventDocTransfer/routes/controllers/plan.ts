import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocParseBody } from '../../../eventDoc/routes';
import { askEventDocTransferProvideRequestScope, askEventDocTransferReadRegistry } from '../../globals';
import { askEventDocBundlePlan, askEventDocTransferReadBundle } from '../../logic';
import { EventDocTransferPlanResult } from '../../models';

function* askEventDocTransferPlan(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { transferId } = yield* askEventDocParseBody<{ transferId: string }>(event);
  const registry = yield* askEventDocTransferReadRegistry();

  const bundle = yield* askEventDocTransferReadBundle(transferId);
  const rows = yield* askEventDocBundlePlan(registry, bundle);

  const result: EventDocTransferPlanResult = { source: bundle.source, rows };

  return qpqWebServerUtils.toJsonEventResponse(result);
}

/** POST /transfer/plan: what importing the uploaded bundle would do. Writes nothing. */
export function* plan(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocTransferProvideRequestScope(event, askEventDocTransferPlan(event));
}
