import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { eventDocTransferEndpoint } from '../../constants';
import { EventDocDocRef, EventDocManifestItem } from '../../models';

/** POST /transfer/manifest: everything that would travel with the picked docs. Builds nothing. */
export function* askEventDocManifestFetch(serviceName: string, docs: EventDocDocRef[]): AskResponse<EventDocManifestItem[]> {
  const response = yield* askApiRequest<{ docs: EventDocDocRef[] }, EventDocManifestItem[]>(
    serviceName,
    'POST',
    eventDocTransferEndpoint('manifest'),
    {
      body: { docs },
    },
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to resolve references for ${docs.length} document(s) (${response.status})`);
  }

  return response.data;
}
