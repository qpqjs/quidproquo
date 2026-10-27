import { Action, KeyValueStoreActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { askToggleLogChecked } from './askToggleLogChecked';

describe('askToggleLogChecked', () => {
  it.each([true, false])('updates checked=%s and announces the result to admins', (checked: boolean) => {
    let updateAction: Action<any> | undefined;
    const updatedLog = { correlation: 'abc', checked };
    const sentLogs: any[] = [];

    runStory(askToggleLogChecked('abc', checked), {
      [UserDirectoryActionType.ReadAccessToken]: { username: 'joe' },
      [KeyValueStoreActionType.Update]: (action: Action<any>) => {
        updateAction = action;
        return updatedLog;
      },
      [KeyValueStoreActionType.Scan]: { items: [{ id: 'c1', userId: 'u1' }], nextPageKey: undefined },
      [WebsocketActionType.SendMessage]: (action: Action<any>) => {
        sentLogs.push(action.payload.payload.payload.log);
      },
    });

    expect(updateAction?.payload.key).toBe('abc');
    expect(sentLogs).toEqual([updatedLog]);
  });
});
