import { askStorageScopeProvide, FileActionType, GuidActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { askEventDocCopyAsset } from './askEventDocCopyAsset';

const source = { guid: 'asset-1', filename: 'render.pdf', mimetype: 'application/pdf' };

const underPackBuilds = <T>(story: Parameters<typeof askEventDocProvideStore<T>>[1]) =>
  askEventDocProvideStore({ storeName: 'packBuilds', type: 'packBuild' }, story);

describe('askEventDocCopyAsset', () => {
  it('copies from the source collection drive to this collection drive under the ambient scope', () => {
    const copies: unknown[] = [];

    const ref = runStory(
      askStorageScopeProvide('tenant-a', underPackBuilds(askEventDocCopyAsset('renderGroups', 'group-1', source, 'build-1', 'welcome.pdf'))),
      {
        [GuidActionType.New]: 'asset-2',
        [FileActionType.Copy]: (action: { payload: unknown }) => {
          copies.push(action.payload);
          return undefined;
        },
      },
    );

    expect(copies).toEqual([
      {
        sourceDrive: 'rendergroupsedocs',
        sourceFilepath: 'group-1/assets/asset-1',
        targetDrive: 'packbuildsedocs',
        targetFilepath: 'build-1/assets/asset-2',
        scope: 'tenant-a',
      },
    ]);
    expect(ref).toEqual({ guid: 'asset-2', filename: 'welcome.pdf', mimetype: 'application/pdf' });
  });

  it('keeps the source filename when none is given, and passes no scope when unscoped', () => {
    const copies: { scope?: string }[] = [];

    const ref = runStory(underPackBuilds(askEventDocCopyAsset('renderGroups', 'group-1', source, 'build-1')), {
      [GuidActionType.New]: 'asset-2',
      [FileActionType.Copy]: (action: { payload: { scope?: string } }) => {
        copies.push(action.payload);
        return undefined;
      },
    });

    expect(ref.filename).toBe('render.pdf');
    expect(copies[0].scope).toBeUndefined();
  });
});
