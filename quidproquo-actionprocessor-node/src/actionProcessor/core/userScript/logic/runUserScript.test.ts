import { askUserScriptExecute, ErrorTypeEnum, resolveActionResult, resolveActionResultError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { runUserScript } from './runUserScript';

const SCRIPT = `
  exports.add = (a, b) => a + b;
  exports.later = async (id) => ({ id });
  exports.story = function* (seed) { const doubled = yield { type: 'Double', payload: { value: seed } }; return doubled + 1; };
  exports.notCallable = 42;
  exports.explodes = () => { throw new Error('kaboom'); };
`;

// A stand-in for the runtime: answers every yielded action with double its value.
const resolveStory = async (story: () => Generator<any, any, any>) => {
  const iterator = story();
  let step = iterator.next();
  const history: unknown[] = [];
  while (!step.done) {
    const value = step.value.payload.value * 2;
    history.push(step.value);
    step = iterator.next(value);
  }
  return { result: step.value, history } as any;
};

const run = (functionName: string, args: unknown[] = [], source = SCRIPT) =>
  runUserScript({ source, filename: 'scripts/a/main.js', functionName, args, modules: {}, resolveStory: resolveStory as any });

describe('runUserScript', () => {
  it('returns a plain export result', async () => {
    expect(resolveActionResult(await run('add', [20, 22]))).toBe(42);
  });

  it('awaits a promise-returning export', async () => {
    expect(resolveActionResult(await run('later', ['abc']))).toEqual({ id: 'abc' });
  });

  it('drives a generator export through the given story resolver', async () => {
    expect(resolveActionResult(await run('story', [21]))).toBe(43);
  });

  it('maps a module outside the map to ModuleNotFound', async () => {
    const error = resolveActionResultError(await run('add', [], `require('fs');`));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.ModuleNotFound);
  });

  it('maps a module body that throws to ScriptInvalid', async () => {
    const error = resolveActionResultError(await run('add', [], `throw new Error('top');`));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.ScriptInvalid);
    expect(error.errorText).toContain('top');
  });

  it('labels a missing or non-function export with filename#functionName by default', async () => {
    const missing = resolveActionResultError(await run('nope'));
    const notCallable = resolveActionResultError(await run('notCallable'));

    expect(missing.errorType).toBe(askUserScriptExecute.errorType.FunctionNotFound);
    expect(missing.errorText).toContain('scripts/a/main.js#nope');
    expect(notCallable.errorType).toBe(askUserScriptExecute.errorType.FunctionNotFound);
  });

  it('maps a synchronous throw to FunctionThrew', async () => {
    const error = resolveActionResultError(await run('explodes'));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.FunctionThrew);
    expect(error.errorText).toContain('kaboom');
  });

  it('uses the given label in messages', async () => {
    const result = await runUserScript({
      source: SCRIPT,
      filename: 'main.js',
      functionName: 'nope',
      args: [],
      modules: {},
      resolveStory: resolveStory as any,
      label: 'scripts:tenant/main.js#nope',
    });

    expect(resolveActionResultError(result).errorText).toContain('[scripts:tenant/main.js#nope]');
  });

  it('keeps the type of an error from the script story', async () => {
    const failing = async () => ({ error: { errorType: ErrorTypeEnum.NotFound, errorText: 'boom' }, history: [] }) as any;
    const result = await runUserScript({ source: SCRIPT, filename: 'main.js', functionName: 'story', args: [1], modules: {}, resolveStory: failing });

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
  });
});
