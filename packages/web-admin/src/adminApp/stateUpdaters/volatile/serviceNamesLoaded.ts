import { VolatileServiceNamesLoadedPayload } from '../../effects/volatile/VolatileServiceNamesLoadedEffect';
import { VolatileState } from '../../VolatileState';

export const serviceNamesLoaded = (state: VolatileState, payload: VolatileServiceNamesLoadedPayload): VolatileState => ({
  ...state,
  serviceNames: payload.serviceNames,
  logServiceName: payload.logServiceName,
});
