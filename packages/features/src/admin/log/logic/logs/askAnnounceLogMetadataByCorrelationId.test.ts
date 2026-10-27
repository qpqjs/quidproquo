import { KeyValueStoreActionType, runStory } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { askAnnounceLogMetadataByCorrelationId } from './askAnnounceLogMetadataByCorrelationId';

describe('askAnnounceLogMetadataByCorrelationId', () => {
  it('announces the metadata to admins when the log exists', () => {
    const sentLogs: any[] = [];

    runStory(askAnnounceLogMetadataByCorrelationId('abc'), {
      [KeyValueStoreActionType.Query]: { items: [{ correlation: 'abc' }], nextPageKey: undefined },
      [KeyValueStoreActionType.Scan]: { items: [{ id: 'c1', userId: 'u1' }], nextPageKey: undefined },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sentLogs.push(action.payload.payload.payload.log);
      },
    });

    expect(sentLogs).toEqual([{ correlation: 'abc' }]);
  });

  it('does nothing when the log is missing', () => {
    let scanned = false;

    runStory(askAnnounceLogMetadataByCorrelationId('abc'), {
      [KeyValueStoreActionType.Query]: { items: [], nextPageKey: undefined },
      [KeyValueStoreActionType.Scan]: () => {
        scanned = true;
        return { items: [], nextPageKey: undefined };
      },
    });

    expect(scanned).toBe(false);
  });
});
