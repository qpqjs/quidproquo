import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { eventDocTransferEndpoint } from '../../constants';
import { EventDocDocRef, EventDocTransferExportResult } from '../../models';

/** POST /transfer/export: stages the bundle and returns a short-lived download url. */
export function* askEventDocExportFetch(serviceName: string, docs: EventDocDocRef[]): AskResponse<EventDocTransferExportResult> {
  const response = yield* askApiRequest<{ docs: EventDocDocRef[] }, EventDocTransferExportResult>(
    serviceName,
    'POST',
    eventDocTransferEndpoint('export'),
    { body: { docs } },
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to export ${docs.length} document(s) (${response.status})`);
  }

  return response.data;
}
