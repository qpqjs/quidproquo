import { EmailActionType } from 'quidproquo-webserver';

import { WebserverEmailSendEmailCustomAction } from '../../custom';
import { ActionComponent } from '../../types';

const webserverEmailActionComponentMap: Record<string, ActionComponent> = {
  [EmailActionType.SendEmail]: WebserverEmailSendEmailCustomAction,
};

export default webserverEmailActionComponentMap;
