import { askFileListDirectory, FileActionType, runStory, throwsError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEventDocStoreProvide } from '../context/askEventDocStoreProvide';
import { buildEventDocStore } from '../context/buildEventDocStore';
import { askEventDocListAssets } from './askEventDocListAssets';

const store = buildEventDocStore({ storeName: 'templates', type: 'template' });

const listAssets = (docId: string) => askEventDocStoreProvide(store, askEventDocListAssets(docId));

describe('askEventDocListAssets', () => {
  it('returns the guids under the doc that owns them', () => {
    const guids = runStory(listAssets('doc-1'), {
      [FileActionType.ListDirectory]: {
        fileInfos: [
          { filepath: 'doc-1/assets/guid-a', drive: store.storageDriveName, isDir: false },
          { filepath: 'doc-1/assets/guid-b', drive: store.storageDriveName, isDir: false },
        ],
        pageToken: undefined,
      },
    });

    expect(guids).toEqual(['guid-a', 'guid-b']);
  });

  it('treats a missing assets folder as no assets', () => {
    // A doc that never uploaded anything: S3 lists an absent prefix as empty, a filesystem drive
    // raises DirectoryNotFound. Exporting such a doc must not fail on either.
    const guids = runStory(listAssets('doc-1'), {
      [FileActionType.ListDirectory]: () => throwsError(askFileListDirectory.errorType.DirectoryNotFound, 'Directory not found: doc-1/assets'),
    });

    expect(guids).toEqual([]);
  });

  it('propagates any other listing failure', () => {
    expect(() =>
      runStory(listAssets('doc-1'), {
        [FileActionType.ListDirectory]: () => throwsError(askFileListDirectory.errorType.AccessDenied, 'nope'),
      }),
    ).toThrow();
  });
});
