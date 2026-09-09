import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { eventDocTransferEndpoint } from '../../constants';
import { EventDocTransferPlanResult } from '../../models';

/** POST /transfer/plan: what importing the uploaded bundle would do. Writes nothing. */
export function* askEventDocPlanFetch(serviceName: string, transferId: string): AskResponse<EventDocTransferPlanResult> {
  const response = yield* askApiRequest<{ transferId: string }, EventDocTransferPlanResult>(serviceName, 'POST', eventDocTransferEndpoint('plan'), {
    body: { transferId },
  });

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Could not read that bundle (${response.status})`);
  }

  return response.data;
}
