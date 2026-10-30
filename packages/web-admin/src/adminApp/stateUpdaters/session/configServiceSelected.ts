import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionConfigServiceSelectedData } from '../../effects/session/AdminSessionConfigServiceSelectedEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

export const configServiceSelected = (
  state: AdminSessionState,
  { data }: EventDocEventPayload<AdminSessionConfigServiceSelectedData>,
): AdminSessionState => ({
  ...state,
  configSelectedService: data.service,
});
