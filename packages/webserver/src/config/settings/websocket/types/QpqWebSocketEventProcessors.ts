import { QpqFunctionRuntime } from '@qpqjs/core';

export type QpqWebSocketEventProcessors = {
  onConnect?: QpqFunctionRuntime;
  onDisconnect?: QpqFunctionRuntime;
  onMessage?: QpqFunctionRuntime;

  // [type: string]: QpqSourceEntry;
};
