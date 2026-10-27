import { WebsocketActionType } from 'quidproquo-webserver';

const webserverWebsocketActionComponentMap: Record<string, string[]> = {
  [WebsocketActionType.SendMessage]: ['askWebsocketSendMessage', 'websocketApiName', 'connectionId', 'payload'],
};

export default webserverWebsocketActionComponentMap;
