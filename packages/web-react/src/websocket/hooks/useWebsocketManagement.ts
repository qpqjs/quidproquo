import { Nullable } from '@qpqjs/core';
import { WebsocketService } from '@qpqjs/web';

import { useEffect, useState } from 'react';

export const useWebsocketManagement = (wsUrl: string) => {
  const [websocketApi, setWebsocketApi] = useState<Nullable<WebsocketService>>(null);

  useEffect(() => {
    const wsService = new WebsocketService(wsUrl);
    setWebsocketApi(wsService);

    return () => {
      wsService.destroy();
    };
  }, [wsUrl]);

  return websocketApi;
};
