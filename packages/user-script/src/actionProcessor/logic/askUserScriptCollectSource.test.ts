import { askUserScriptBuild, FileActionType } from '@qpqjs/core';
import { runStory, StoryError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserScriptCollectSource } from './askUserScriptCollectSource';
import { USER_SCRIPT_SOURCE_LIMITS } from './USER_SCRIPT_SOURCE_LIMITS';

type Entry = { filepath: string; isDir: boolean };

// A listing mock over a flat map of drive paths; `pagedDirectory` answers that one
// directory in two pages to prove the walk follows pageToken.
const createMocks = (files: Record<string, string>, pagedDirectory?: string) => {
  const entriesOf = (folderPath: string): Entry[] => {
    const prefix = `${folderPath}/`;
    const seen = new Map<string, Entry>();
    for (const filepath of Object.keys(files)) {
      if (!filepath.startsWith(prefix)) continue;
      const rest = filepath.slice(prefix.length);
      const [head, ...tail] = rest.split('/');
      const entryPath = `${prefix}${head}`;
      seen.set(entryPath, { filepath: entryPath, isDir: tail.length > 0 });
    }
    return [...seen.values()];
  };

  const listCalls: { folderPath: string; pageToken?: string }[] = [];

  return {
    listCalls,
    mocks: {
      [FileActionType.ListDirectory]: (action: { payload: { folderPath: string; pageToken?: string } }) => {
        listCalls.push({ folderPath: action.payload.folderPath, pageToken: action.payload.pageToken });
        const entries = entriesOf(action.payload.folderPath);
        if (action.payload.folderPath === pagedDirectory) {
          return action.payload.pageToken
            ? { fileInfos: entries.slice(1), pageToken: undefined }
            : { fileInfos: entries.slice(0, 1), pageToken: 'next' };
        }
        return { fileInfos: entries, pageToken: undefined };
      },
      [FileActionType.ReadTextContents]: (action: { payload: { filepath: string } }) => files[action.payload.filepath],
    },
  };
};

describe('askUserScriptCollectSource', () => {
  it('reads every file under the directory, recursively, with project-relative paths', () => {
    const { mocks } = createMocks({
      'scripts/a/source/src/main.ts': 'main',
      'scripts/a/source/src/helpers/format.ts': 'helper',
      'scripts/a/source/package.json': '{}',
      'scripts/other/src/main.ts': 'not mine',
    });

    const files = runStory(askUserScriptCollectSource('scripts', 'scripts/a/source'), mocks);

    expect(files.sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { path: 'package.json', text: '{}' },
      { path: 'src/helpers/format.ts', text: 'helper' },
      { path: 'src/main.ts', text: 'main' },
    ]);
  });

  it('follows pageToken when a directory lists in pages and trims slashes on the directory', () => {
    const { mocks, listCalls } = createMocks({ 'scripts/a/source/src/main.ts': 'main', 'scripts/a/source/src/b.ts': 'b' }, 'scripts/a/source/src');

    const files = runStory(askUserScriptCollectSource('scripts', '/scripts/a/source/'), mocks);

    expect(files.map((file) => file.path).sort()).toEqual(['src/b.ts', 'src/main.ts']);
    expect(listCalls.filter((call) => call.folderPath === 'scripts/a/source/src')).toEqual([
      { folderPath: 'scripts/a/source/src', pageToken: undefined },
      { folderPath: 'scripts/a/source/src', pageToken: 'next' },
    ]);
  });

  it('refuses a node_modules folder as SourceTooLarge', () => {
    const { mocks } = createMocks({ 'scripts/a/source/src/main.ts': 'main', 'scripts/a/source/node_modules/x/index.js': 'x' });

    const run = () => runStory(askUserScriptCollectSource('scripts', 'scripts/a/source'), mocks);

    expect(run).toThrow(StoryError);
    expect(run).toThrow(`${askUserScriptBuild.errorType.SourceTooLarge}: [scripts:scripts/a/source] contains a node_modules folder`);
  });

  it('refuses more files than the cap', () => {
    const files = Object.fromEntries(
      Array.from({ length: USER_SCRIPT_SOURCE_LIMITS.maxFiles + 1 }, (_, i) => [`scripts/a/source/src/f${i}.ts`, 'x']),
    );

    const run = () => runStory(askUserScriptCollectSource('scripts', 'scripts/a/source'), createMocks(files).mocks);

    expect(run).toThrow(`more than ${USER_SCRIPT_SOURCE_LIMITS.maxFiles} files`);
  });

  it('refuses more bytes than the cap', () => {
    const { mocks } = createMocks({ 'scripts/a/source/src/main.ts': 'x'.repeat(USER_SCRIPT_SOURCE_LIMITS.maxBytes + 1) });

    const run = () => runStory(askUserScriptCollectSource('scripts', 'scripts/a/source'), mocks);

    expect(run).toThrow(`larger than ${USER_SCRIPT_SOURCE_LIMITS.maxBytes} bytes`);
  });
});
