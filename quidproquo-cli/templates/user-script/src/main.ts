import { askFileWriteTextContents, AskResponse } from 'quidproquo-core';

// Every export of this file is callable by name through askUserScriptExecute. A
// generator export is a story: it yields quidproquo actions and its return value is
// the result. A plain function export just returns its value.

export function* add(drive: string, filepath: string, a: number, b: number): AskResponse<number> {
  const sum = a + b;
  yield* askFileWriteTextContents(drive, filepath, `added ${sum}`);
  return sum;
}

export const greet = (name: string): string => `hello ${name}`;
