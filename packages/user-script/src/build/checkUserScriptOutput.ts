import { getUserScriptModuleMap, listUserScriptExports, UserScriptModuleMap } from '@qpqjs/actionprocessor-node';

import fs from 'fs';

import { assertUserScriptExports } from './assertUserScriptExports';

/**
 * Loads a built file in this process and applies the output contract. For a developer's own
 * build (`qpq script:build`) only: a platform build asks the sandbox with
 * askUserScriptListExports instead, so no script code runs in the host.
 */
export const checkUserScriptOutput = (entryPath: string, hostModules: UserScriptModuleMap = {}): string[] =>
  assertUserScriptExports(entryPath, listUserScriptExports(entryPath, fs.readFileSync(entryPath, 'utf8'), getUserScriptModuleMap(hostModules)));
