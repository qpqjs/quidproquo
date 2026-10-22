import * as quidproquoCore from 'quidproquo-core';
import { FEDERATED_SHARED_PACKAGE_NAMES } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getUserScriptModuleMap } from './getUserScriptModuleMap';

describe('getUserScriptModuleMap', () => {
  it('covers exactly the shared package list with the host module instances', () => {
    const map = getUserScriptModuleMap();

    expect(Object.keys(map).sort()).toEqual([...FEDERATED_SHARED_PACKAGE_NAMES].sort());
    expect((map['quidproquo-core'] as typeof quidproquoCore).askFileReadTextContents).toBe(quidproquoCore.askFileReadTextContents);
  });
});
