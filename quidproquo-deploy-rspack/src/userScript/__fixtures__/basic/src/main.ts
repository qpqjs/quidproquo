import { askFileWriteTextContents, AskResponse } from 'quidproquo-core';

import { uuidv7 } from 'uuidv7';

import { formatSum } from './helpers/formatSum';

export function* add(drive: string, filepath: string, a: number, b: number): AskResponse<number> {
  const sum = a + b;
  yield* askFileWriteTextContents(drive, filepath, formatSum(sum));
  return sum;
}

export const greet = (name: string): string => `hello ${name}`;

export const makeId = (): string => uuidv7();
