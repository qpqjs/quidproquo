import { askDateNow, AskResponse } from '@qpqjs/core';

// Every export of this file is callable by name through askUserScriptExecute. A
// generator export is a story: it yields quidproquo actions and its return value is
// the result. A plain function export just returns its value. Scripts run in a sandbox
// whose actions are the pure ones (date, guid, log, math) and network requests, so a story
// may stamp a time, mint an id or call an HTTP API, but not read or write the service's
// resources.

export const add = (a: number, b: number): number => a + b;

export function* stampedGreeting(name: string): AskResponse<string> {
  const now = yield* askDateNow();
  return `hello ${name} @ ${now}`;
}
