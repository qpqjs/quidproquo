import { AskResponse } from '@qpqjs/core';

import { askPlatformRequest } from '../../../platformLogic/network/askPlatformRequest';
import { askUIVolatileServiceNamesLoaded } from '../../actionCreators/volatile/askUIVolatileServiceNamesLoaded';

type GetServiceNamesResponse = {
  services: string[];
  logServiceName: string;
};

export function* askLoadServiceNames(): AskResponse<void> {
  const response = yield* askPlatformRequest<GetServiceNamesResponse, undefined>('GET', '/admin/services');

  if (response.status < 200 || response.status >= 300) {
    return;
  }

  yield* askUIVolatileServiceNamesLoaded(response.data.services, response.data.logServiceName);
}
