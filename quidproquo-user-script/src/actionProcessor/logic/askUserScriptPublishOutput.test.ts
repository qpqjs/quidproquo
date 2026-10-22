import { FileActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askUserScriptPublishOutput } from './askUserScriptPublishOutput';

describe('askUserScriptPublishOutput', () => {
  it('writes main.js and its map into the output directory, passing the scope through', () => {
    const writes: unknown[] = [];

    runStory(askUserScriptPublishOutput('scripts', 'a/built/', 'js text', 'map text', 'tenant-1'), {
      [FileActionType.WriteTextContents]: (action) => {
        writes.push(action.payload);
        return undefined;
      },
    });

    expect(writes).toEqual([
      { drive: 'scripts', filepath: 'a/built/main.js', data: 'js text', storageDriveAdvancedWriteOptions: undefined, scope: 'tenant-1' },
      { drive: 'scripts', filepath: 'a/built/main.js.map', data: 'map text', storageDriveAdvancedWriteOptions: undefined, scope: 'tenant-1' },
    ]);
  });
});
