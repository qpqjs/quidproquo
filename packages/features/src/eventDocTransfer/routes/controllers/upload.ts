import { AskResponse } from '@qpqjs/core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from '@qpqjs/webserver';

import { askEventDocTransferProvideRequestScope } from '../../globals';
import { askEventDocTransferUploadTarget } from '../../logic';

function* askEventDocTransferUpload(): AskResponse<HTTPEventResponse> {
  const target = yield* askEventDocTransferUploadTarget();

  return qpqWebServerUtils.toJsonEventResponse(target);
}

/** POST /transfer/upload: a presigned PUT for a bundle file plus the transferId plan/import quote back. */
export function* upload(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocTransferProvideRequestScope(event, askEventDocTransferUpload());
}
