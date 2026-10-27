import { askProcessOnConnect } from './askProcessOnConnect';
import { askProcessOnDisconnect } from './askProcessOnDisconnect';
import { askProcessOnMessage } from './askProcessOnMessage';

export const webSocketQueueLogic = {
  askProcessOnConnect,
  askProcessOnDisconnect,
  askProcessOnMessage,
};
