import { FileActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserScriptPublishOutput } from './askUserScriptPublishOutput';

describe('askUserScriptPublishOutput', () => {
  it('writes the built script to exactly the output file and nothing else, passing the scope through', () => {
    const writes: unknown[] = [];

    runStory(askUserScriptPublishOutput('scripts', 'doc-1/assets/abc', 'js text', 'tenant-1'), {
      [FileActionType.WriteTextContents]: (action: any) => {
        writes.push(action.payload);
        return undefined;
      },
    });

    expect(writes).toEqual([
      { drive: 'scripts', filepath: 'doc-1/assets/abc', data: 'js text', storageDriveAdvancedWriteOptions: undefined, scope: 'tenant-1' },
    ]);
  });
});
