import { askFileWriteTextContents, AskResponse } from 'quidproquo-core';

import { formatGreeting } from './helpers/formatGreeting';

// Each export is callable by name through askUserScriptExecute; the smoke test calls
// both and checks the file `add` writes.

export function* add(
  drive: string,
  filepath: string,
  a: number,
  b: number
): AskResponse<number> {
  const sum = a + b;
  yield* askFileWriteTextContents(drive, filepath, `added ${sum}`);
  return sum;
}

export const greet = (name: string): string => formatGreeting(name);
