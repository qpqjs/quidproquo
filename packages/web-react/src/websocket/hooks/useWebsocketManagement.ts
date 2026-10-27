import { WebsocketService } from 'quidproquo-web';

import { useEffect, useState } from 'react';

export const useWebsocketManagement = (wsUrl: string) => {
  const [websocketApi, setWebsocketApi] = useState<WebsocketService | null>(null);

  useEffect(() => {
    const wsService = new WebsocketService(wsUrl);
    setWebsocketApi(wsService);

    return () => {
      wsService.destroy();
    };
  }, [wsUrl]);

  return websocketApi;
};
