import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';
import { askApiRequest } from '@qpqjs/webserver';

import { eventDocTransferEndpoint } from '../../constants';
import { EventDocTransferUploadTarget } from '../../models';

/** POST /transfer/upload: a presigned PUT target for a bundle file. */
export function* askEventDocUploadTargetFetch(serviceName: string): AskResponse<EventDocTransferUploadTarget> {
  const response = yield* askApiRequest<EventDocTransferUploadTarget, void>(serviceName, 'POST', eventDocTransferEndpoint('upload'));

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Could not start an import (${response.status})`);
  }

  return response.data;
}
