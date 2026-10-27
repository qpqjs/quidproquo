import { askEmailSendEmail, askEmailSetDeliveryStatus, EmailActionType } from 'quidproquo-webserver';

const webserverEmailActionComponentMap: Record<string, string[]> = {
  [EmailActionType.SendEmail]: ['askEmailSendEmail', 'from', 'to', 'cc', 'bcc', 'replyTo', 'subject'],
  [EmailActionType.SetDeliveryStatus]: ['askEmailSetDeliveryStatus', 'messageId', 'deliveryStatus', 'reason'],
};

export default webserverEmailActionComponentMap;
