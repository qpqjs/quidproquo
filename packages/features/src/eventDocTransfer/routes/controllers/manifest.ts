import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocParseBody } from '../../../eventDoc/routes';
import { askEventDocTransferProvideRequestScope, askEventDocTransferReadRegistry } from '../../globals';
import { askEventDocManifest } from '../../logic';
import { EventDocDocRef } from '../../models';

function* askEventDocTransferManifest(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { docs } = yield* askEventDocParseBody<{ docs: EventDocDocRef[] }>(event);
  const registry = yield* askEventDocTransferReadRegistry();

  const items = yield* askEventDocManifest(registry, docs ?? []);

  return qpqWebServerUtils.toJsonEventResponse(items);
}

/** POST /transfer/manifest: every doc that would travel with `{ docs: [...] }`, deduped, without building anything. */
export function* manifest(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocTransferProvideRequestScope(event, askEventDocTransferManifest(event));
}
