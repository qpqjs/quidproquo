import {
  askDateNow,
  askFileWriteTextContents,
  askNetworkRequest,
  AskResponse,
  HTTPNetworkResponse,
} from '@qpqjs/core';

import { probeAws, probeSurvivor, spawnSurvivor } from 'smoke-probe';

import { formatGreeting } from './helpers/formatGreeting';

// Each export is callable by name through askUserScriptExecute. The smoke test calls add,
// greet, stampedGreeting and postJson, and expects writeFile to fail: a script runs in a
// sandbox whose actions are the pure ones plus network requests, so a file write has no
// processor there. probeAwsAccess goes around the framework at AWS directly, through the
// service's probe module, and must be refused there too. startSurvivor leaves processes
// behind on purpose and checkSurvivor, called next, must find them gone.

export const add = (a: number, b: number): number => a + b;

export const greet = (name: string): string => formatGreeting(name);

export function* stampedGreeting(name: string): AskResponse<string> {
  const now = yield* askDateNow();
  return `${formatGreeting(name)} @ ${now}`;
}

export function* postJson(
  url: string,
  body: unknown
): AskResponse<HTTPNetworkResponse<unknown>> {
  return yield* askNetworkRequest<unknown, unknown>('POST', url, { body });
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

export const startSurvivor = (port: number): number => spawnSurvivor(port);

export const checkSurvivor = (port: number): Promise<unknown> =>
  probeSurvivor(port);
