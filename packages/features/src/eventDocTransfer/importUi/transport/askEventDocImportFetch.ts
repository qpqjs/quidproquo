import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { eventDocTransferEndpoint } from '../../constants';
import { EventDocTransferPlanRow } from '../../models';

/** POST /transfer/import: applies the uploaded bundle and returns a row per doc. */
export function* askEventDocImportFetch(serviceName: string, transferId: string, force = false): AskResponse<EventDocTransferPlanRow[]> {
  const response = yield* askApiRequest<{ transferId: string; force: boolean }, EventDocTransferPlanRow[]>(
    serviceName,
    'POST',
    eventDocTransferEndpoint('import'),
    { body: { transferId, force } },
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Import failed (${response.status})`);
  }

  return response.data;
}
