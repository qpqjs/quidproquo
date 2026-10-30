import { AskResponse } from '@qpqjs/core';

import { askPlatformRequest } from '../../../platformLogic/network/askPlatformRequest';
import { askVolatileServiceNamesLoaded } from '../../actionCreators/volatile/askVolatileServiceNamesLoaded';

type GetServiceNamesResponse = {
  services: string[];
  logServiceName: string;
};

export function* askLoadServiceNames(): AskResponse<void> {
  const response = yield* askPlatformRequest<GetServiceNamesResponse, undefined>('GET', '/admin/services');

  if (response.status < 200 || response.status >= 300) {
    return;
  }

  yield* askVolatileServiceNamesLoaded(response.data.services, response.data.logServiceName);
}
