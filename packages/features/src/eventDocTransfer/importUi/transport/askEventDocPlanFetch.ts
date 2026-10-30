import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';
import { askApiRequest } from '@qpqjs/webserver';

import { eventDocTransferEndpoint } from '../../constants';
import { EventDocTransferPlanResult } from '../../models';

/** POST /transfer/plan: what importing the uploaded bundle would do. Writes nothing. */
export function* askEventDocPlanFetch(serviceName: string, transferId: string): AskResponse<EventDocTransferPlanResult> {
  const response = yield* askApiRequest<EventDocTransferPlanResult, { transferId: string }>(serviceName, 'POST', eventDocTransferEndpoint('plan'), {
    body: { transferId },
  });

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Could not read that bundle (${response.status})`);
  }

  return response.data;
}
