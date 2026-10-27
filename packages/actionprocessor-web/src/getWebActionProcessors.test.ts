// @vitest-environment jsdom
import {
  buildTestQpqConfig,
  ConfigActionType,
  CryptoActionType,
  EventBusActionType,
  FileActionType,
  KeyValueStoreActionType,
  noopDynamicModuleLoader,
  QueueActionType,
  UserDirectoryActionType,
} from '@qpqjs/core';
import { QueryParamsActionType, WindowActionType } from '@qpqjs/web';
import { ApiActionType, ServiceFunctionActionType, WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getWebActionProcessors } from './getWebActionProcessors';

describe('getWebActionProcessors', () => {
  it('assembles a populated map including the web-specific processors', async () => {
    const processors = await getWebActionProcessors(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(Object.keys(processors).length).toBeGreaterThan(0);
    for (const actionType of [
      ApiActionType.Request,
      QueryParamsActionType.Get,
      QueryParamsActionType.GetAll,
      QueryParamsActionType.Set,
      WindowActionType.GetLocation,
      ConfigActionType.GetParameter,
    ]) {
      expect(typeof processors[actionType]).toBe('function');
    }
  });

  // Security regression: the browser bundle runs as the user, so no processor that needs the service role
  // (secrets, stores, files, directories, buses, queues, keys, cross-service invokes) may be registered.
  it('registers no server-only processor', async () => {
    const processors = await getWebActionProcessors(buildTestQpqConfig(), noopDynamicModuleLoader);
    const serverOnly = [
      ConfigActionType.GetSecret,
      ...Object.values(KeyValueStoreActionType),
      ...Object.values(FileActionType),
      ...Object.values(UserDirectoryActionType),
      ...Object.values(EventBusActionType),
      ...Object.values(QueueActionType),
      ...Object.values(CryptoActionType),
      ...Object.values(ServiceFunctionActionType),
      ...Object.values(WebsocketActionType),
    ];

    expect(serverOnly.filter((actionType) => actionType in processors)).toEqual([]);
  });
});
