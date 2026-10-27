import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { ConfigServiceSelectedData } from '../../effects/session/ConfigServiceSelectedEvent';

export const configServiceSelected = (state: AdminSessionState, { data }: EventDocEventPayload<ConfigServiceSelectedData>): AdminSessionState => ({
  ...state,
  configSelectedService: data.service,
});
