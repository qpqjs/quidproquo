import { ActionSearchDefinition } from '../../domain/ActionSearchDefinition';
import { emailSendActionSearchDefinition } from './emailSendActionSearchDefinition';
import { emailSetDeliveryStatusActionSearchDefinition } from './emailSetDeliveryStatusActionSearchDefinition';
import { networkRequestActionSearchDefinition } from './networkRequestActionSearchDefinition';

export const actionSearchRegistry: ActionSearchDefinition[] = [
  networkRequestActionSearchDefinition,
  emailSendActionSearchDefinition,
  emailSetDeliveryStatusActionSearchDefinition,
];
