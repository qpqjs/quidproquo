import {
  askDateNow,
  askFileWriteTextContents,
  AskResponse,
} from 'quidproquo-core';

import { probeAws } from 'smoke-probe';

import { formatGreeting } from './helpers/formatGreeting';

// Each export is callable by name through askUserScriptExecute. The smoke test calls the
// first three and expects writeFile to fail: a script runs in a sandbox whose only actions
// are the pure ones, so a file write has no processor there. probeAwsAccess goes around the
// framework at AWS directly, through the service's probe module, and must be refused there too.

export const add = (a: number, b: number): number => a + b;

export const greet = (name: string): string => formatGreeting(name);

export function* stampedGreeting(name: string): AskResponse<string> {
  const now = yield* askDateNow();
  return `${formatGreeting(name)} @ ${now}`;
}

export function* writeFile(
  drive: string,
  filepath: string,
  text: string
): AskResponse<void> {
  yield* askFileWriteTextContents(drive, filepath, text);
}

export const probeAwsAccess = (bucket: string, key: string): Promise<unknown> =>
  probeAws(bucket, key);
