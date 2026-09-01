import { Nullable, QPQConfig, qpqCoreUtils, QpqFunctionRuntime, QpqRuntimeType } from 'quidproquo-core';
import { qpqWebServerUtils, WebSocketEventType, WebSocketQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { createServer } from 'http';
import { RawData, WebSocket, WebSocketServer } from 'ws';

// Deep import (not the actionProcessor barrel): the barrel transitively imports this
// file back through the webserver websocket processors, and entering that loop
// barrel-first breaks module init. The deep path keeps the graph acyclic.
import { getWsWebsocketEventEventProcessor } from '../../actionProcessor/core/event/ws/websocket';
import { closeHttpServerGracefully, processEvent } from '../../logic';
import { DevServerPluginStop } from '../../plugins/types/DevServerPluginStop';
import { ResolvedDevServerConfig } from '../../types';
import { WsEvent } from './types';
import { findRegisteredWebSocketServer, getRegisteredWebSocketServers, setRegisteredWebSocketServers } from './webSocketConnectionRegistry';

type WebSocketQPQWebServerConfigSettingMap = {
  service: string;
  apiName: string;
  setting: WebSocketQPQWebServerConfigSetting;
  qpqConfig: QPQConfig;
};

type WebSocketQPQWebServerConfigSettingMapWithWebSocketServer = WebSocketQPQWebServerConfigSettingMap & {
  server: WebSocketServer;
  connections: Record<string, WebSocket>;
};

const getDynamicModuleLoader = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return async (runtime: QpqFunctionRuntime): Promise<any> => devServerConfig.dynamicModuleLoader(serviceName, runtime);
};

const startServer = (
  settingsMap: WebSocketQPQWebServerConfigSettingMap,
  devServerConfig: ResolvedDevServerConfig,
): WebSocketQPQWebServerConfigSettingMapWithWebSocketServer => {
  const webSocketServer = new WebSocketServer({ noServer: true });

  console.log(`WebSocket: ws://${devServerConfig.serverDomain}:${devServerConfig.webSocketPort}/${settingsMap.service}/${settingsMap.apiName}`);

  webSocketServer.on('connection', (ws, req) => {
    const connectionId: string = req.headers['sec-websocket-key'] || crypto.randomUUID();
    const sourceIp = req.socket.remoteAddress === '::1' || !req.socket.remoteAddress ? '127.0.0.1' : req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown agent';

    const server = findRegisteredWebSocketServer(settingsMap.service, settingsMap.apiName)!;
    server.connections[connectionId] = ws;

    const processWsEvent = (wsEvent: WsEvent) =>
      processEvent<WsEvent, void>(
        wsEvent,
        settingsMap.qpqConfig,
        getDynamicModuleLoader(settingsMap.qpqConfig, devServerConfig),
        getWsWebsocketEventEventProcessor,
        QpqRuntimeType.WEBSOCKET_EVENT,
        () => ({
          depth: 0,
          context: {},
        }),
        devServerConfig,
      );

    // Events for one connection must run in arrival order (connect -> messages
    // -> disconnect). Concurrent processing lets an early message (e.g. the
    // Authenticate sent on socket open) read the connection store before the
    // connect handler has written the connection record, silently dropping it.
    // API Gateway gives this ordering for free ($connect completes before the
    // handshake finishes); this chain mirrors that behaviour locally.
    let wsEventChain: Promise<unknown> = Promise.resolve();
    const enqueueWsEvent = (wsEvent: WsEvent) => {
      wsEventChain = wsEventChain.then(
        () => processWsEvent(wsEvent),
        () => processWsEvent(wsEvent),
      );
    };

    const onConnectEvent: WsEvent = {
      apiName: settingsMap.apiName,
      service: settingsMap.service,
      eventType: WebSocketEventType.Connect,
      body: undefined,
      messageId: crypto.randomUUID(),
      connectionId: connectionId,
      requestTimeEpoch: Date.now(),
      sourceIp: sourceIp,
      userAgent: userAgent,
    };

    enqueueWsEvent(onConnectEvent);

    ws.on('error', console.error);

    ws.on('message', (data: RawData, isBinary) => {
      const onMessageEvent: WsEvent = {
        apiName: settingsMap.apiName,
        service: settingsMap.service,
        eventType: WebSocketEventType.Message,
        body: data,
        messageId: crypto.randomUUID(),
        connectionId: connectionId,
        requestTimeEpoch: Date.now(),
        sourceIp: sourceIp,
        userAgent: userAgent,
      };

      enqueueWsEvent(onMessageEvent);
    });

    ws.on('close', () => {
      delete server.connections[connectionId];

      const onCloseEvent: WsEvent = {
        apiName: settingsMap.apiName,
        service: settingsMap.service,
        eventType: WebSocketEventType.Disconnect,
        body: undefined,
        messageId: crypto.randomUUID(),
        connectionId: connectionId,
        requestTimeEpoch: Date.now(),
        sourceIp: sourceIp,
        userAgent: userAgent,
      };

      enqueueWsEvent(onCloseEvent);
    });
  });

  return {
    ...settingsMap,

    server: webSocketServer,
    connections: {},
  };
};

const getWebSocketQPQWebServerConfigSettingMaps = (qpqConfigs: QPQConfig[]): WebSocketQPQWebServerConfigSettingMap[] => {
  return qpqConfigs
    .flatMap((qpqConfig) => {
      const service = qpqCoreUtils.getApplicationModuleName(qpqConfig);
      return qpqWebServerUtils.getWebsocketSettings(qpqConfig).flatMap((wsc) => {
        const item: WebSocketQPQWebServerConfigSettingMap = {
          apiName: wsc.apiName,
          service,
          setting: wsc,
          qpqConfig,
        };

        return item;
      });
    })
    .filter(
      (item, index, arr) => arr[index].apiName !== item.apiName || !item.setting.owner?.module || arr[index].service === item.setting.owner?.module,
    );
};

export const webSocketImplementation = async (devServerConfig: ResolvedDevServerConfig): Promise<Nullable<DevServerPluginStop>> => {
  if (!devServerConfig.webSocketPort) {
    return null;
  }

  const webSocketQPQWebServerConfigSettingMaps = getWebSocketQPQWebServerConfigSettingMaps(devServerConfig.qpqConfigs);

  const server = createServer();

  setRegisteredWebSocketServers(webSocketQPQWebServerConfigSettingMaps.map((x) => startServer(x, devServerConfig)));

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', 'wss://base.url');

    const serverInfo = getRegisteredWebSocketServers().find((s) => pathname === `/${s.service}/${s.apiName}`);

    if (serverInfo) {
      serverInfo.server.handleUpgrade(request, socket, head, (ws) => {
        serverInfo.server.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(devServerConfig.webSocketPort, 'localhost');

  // Close the ws servers before the http server they upgraded from: that sends
  // a proper close frame, so a browser reconnects against the restarted server
  // instead of sitting on a socket that is quietly dead.
  const closeWebSocketServers = async (): Promise<void> => {
    await Promise.all(
      getRegisteredWebSocketServers().map((registered) => {
        // ws's close() waits for every client to disconnect and will never
        // resolve on its own while a browser tab is still open, so close the
        // sockets first. The close frame is what tells the client to reconnect
        // rather than treat it as a dropped connection.
        registered.server.clients.forEach((client) => client.close());

        return new Promise<void>((resolve) => {
          registered.server.close(() => resolve());
        });
      }),
    );

    await closeHttpServerGracefully(server);
  };

  return closeWebSocketServers;
};
