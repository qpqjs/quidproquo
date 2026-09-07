import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals';
import { askEventDocParseBody } from '../../../eventDoc/routes';
import { askEventDocTransferProvideRequestScope, askEventDocTransferReadRegistry } from '../../globals';
import { askEventDocBundleApply, askEventDocTransferReadBundle } from '../../logic';

function* askEventDocTransferImport(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { transferId, force } = yield* askEventDocParseBody<{ transferId: string; force?: boolean }>(event);
  const registry = yield* askEventDocTransferReadRegistry();

  const importerUserId = yield* askEventDocResolveUserId();

  const bundle = yield* askEventDocTransferReadBundle(transferId);
  const rows = yield* askEventDocBundleApply(registry, bundle, { transferId, force, importerUserId });

  return qpqWebServerUtils.toJsonEventResponse(rows);
}

/** POST /transfer/import: applies the uploaded bundle and reports a row per doc. `force` overwrites diverged docs (tail backed up first). */
export function* importBundle(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocTransferProvideRequestScope(event, askEventDocTransferImport(event));
}
