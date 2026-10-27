import { actionResult, QpqRuntimeType, StoryResult } from 'quidproquo-core';

import * as fs from 'fs';
import { createRequire } from 'module';
import * as os from 'os';
import * as path from 'path';
import ts from 'typescript';
import { afterAll, describe, expect, it } from 'vitest';

import { traceStoryExecution } from './traceStoryExecution';

// NOTE: these tests exercise a REAL V8 inspector session against the current thread —
// they require the vitest 'forks' pool (the default), where each test file runs on the
// main thread of a forked process. Fixtures are written to a temp dir at runtime so the
// traced code is a genuine on-disk script with real line numbers, untouched by vitest's
// transform pipeline.

// realpath: require() resolves symlinks (macOS /var -> /private/var), and script urls
// must line up with the fixture paths the assertions use.
const fixtureDirectory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-trace-test-')));
const fixtureRequire = createRequire(path.join(fixtureDirectory, 'index.js'));

afterAll(() => {
  fs.rmSync(fixtureDirectory, { recursive: true, force: true });
});

const buildRecordedResult = (input: any[], history: Array<{ res: any }>): StoryResult<any> => ({
  input,
  session: { depth: 0, context: {} },
  history: history as any,
  startedAt: '2024-01-01T00:00:00.000Z',
  finishedAt: '2024-01-01T00:00:00.000Z',
  tags: [],
  moduleName: 'test-module',
  correlation: 'corr-trace-1',
  fromCorrelation: 'corr-trace-0',
  runtimeType: QpqRuntimeType.UNIT_TEST,
});

const plainStorySource = `
function formatName(user) {
  const first = user.first.trim();
  const last = user.last.trim();
  return first + ' ' + last;
}

function* askGetRecord(key) {
  const record = yield { type: 'TestStore::Get', payload: { key } };
  return record;
}

function* askOnboardUsers(count) {
  const id = yield { type: 'TestGuid::New' };
  const names = [];
  for (let i = 0; i < count; i += 1) {
    const user = yield* askGetRecord('user-' + i);
    const name = formatName(user);
    names.push(name);
  }
  return { id, names };
}

module.exports = { askOnboardUsers };
`;

const loadPlainStory = () => {
  const storyPath = path.join(fixtureDirectory, 'plainStory.js');
  fs.writeFileSync(storyPath, plainStorySource);
  return { story: fixtureRequire(storyPath).askOnboardUsers, storyPath };
};

const plainStoryRecording = () =>
  buildRecordedResult(
    [2],
    [
      { res: actionResult('guid-123') },
      { res: actionResult({ first: ' First0 ', last: 'Last0' }) },
      { res: actionResult({ first: 'First1', last: ' Last1 ' }) },
    ],
  );

describe('traceStoryExecution', () => {
  it('captures line-by-line steps with local variable values while replaying faithfully', async () => {
    const { story, storyPath } = loadPlainStory();

    const { trace, replay } = await traceStoryExecution(plainStoryRecording(), story);

    // The replay itself must be unperturbed by tracing
    expect(replay.result).toEqual({ id: 'guid-123', names: ['First0 Last0', 'First1 Last1'] });
    expect(replay.error).toBeUndefined();

    expect(trace.correlation).toBe('corr-trace-1');
    expect(trace.moduleName).toBe('test-module');
    expect(trace.truncated).toBe(false);
    expect(trace.stats.breakpoints).toBeGreaterThan(0);
    expect(trace.steps.length).toBeGreaterThan(10);

    // No source map on the fixture -> the generated script itself is the source
    expect(trace.sources.some((source) => source.path.includes(storyPath))).toBe(true);
    expect(trace.sources[0].content).toContain('askOnboardUsers');

    // Locals captured with real names and values (strings are JSON stringified)
    const idStep = trace.steps.find((step) => step.locals.id?.preview === '"guid-123"');
    expect(idStep).toBeDefined();

    const nameStep = trace.steps.find((step) => step.locals.name?.preview === '"First0 Last0"');
    expect(nameStep).toBeDefined();
    expect(nameStep?.functionName).toBe('askOnboardUsers');

    // Object values also carry a deep json serialization for expandable inspection
    const userStep = trace.steps.find((step) => step.locals.user?.json !== undefined);
    expect(userStep).toBeDefined();
    expect(JSON.parse(userStep!.locals.user.json!)).toEqual({ first: ' First0 ', last: 'Last0' });

    // Helper functions in the same script are traced too
    expect(trace.steps.some((step) => step.functionName === 'formatName')).toBe(true);

    // Return break positions carry the value being returned
    const formatNameReturn = trace.steps.find((step) => step.functionName === 'formatName' && step.returnValue);
    expect(formatNameReturn?.returnValue?.preview).toBe('"First0 Last0"');

    const storyReturn = trace.steps.find((step) => step.functionName === 'askOnboardUsers' && step.returnValue);
    expect(storyReturn).toBeDefined();
    expect(JSON.parse(storyReturn!.returnValue!.json!)).toEqual({ id: 'guid-123', names: ['First0 Last0', 'First1 Last1'] });

    // The loop ran twice, so its body statements appear at least twice
    const loopBodyVisits = trace.steps.filter((step) => step.locals.key !== undefined);
    expect(loopBodyVisits.length).toBeGreaterThanOrEqual(2);
  });

  it('marks the trace truncated when the step budget is hit, without breaking the replay', async () => {
    const { story } = loadPlainStory();

    const { trace, replay } = await traceStoryExecution(plainStoryRecording(), story, { maxSteps: 3 });

    expect(replay.result).toEqual({ id: 'guid-123', names: ['First0 Last0', 'First1 Last1'] });
    expect(trace.truncated).toBe(true);
    expect(trace.steps.length).toBeLessThanOrEqual(3);
  });

  it('marks the trace truncated when the wall-clock budget is hit, without breaking the replay', async () => {
    const { story } = loadPlainStory();

    // Zero budget: every pause after the first is over time
    const { trace, replay } = await traceStoryExecution(plainStoryRecording(), story, { maxTraceMs: 0 });

    expect(replay.result).toEqual({ id: 'guid-123', names: ['First0 Last0', 'First1 Last1'] });
    expect(trace.truncated).toBe(true);
    expect(trace.steps.length).toBeLessThan(10);
  });

  it('traces a story exported through a factory wrapper defined in a different module (sibling chunks)', async () => {
    // Mirrors the dynamicRoute pattern: the exported story is a wrapper CREATED inside
    // a shared/vendor module, so [[FunctionLocation]] points at the wrapper's file — the
    // real story body lives in a sibling file that must still be traced.
    const wrapperFactorySource = `
function wrapRoute(runtime) {
  const wrapper = function* wrapper(input) {
    const result = yield* runtime(input);
    return { wrapped: result };
  };
  return wrapper;
}
module.exports = { wrapRoute };
`;

    const innerStorySource = `
function* askGenerateSecret(seed) {
  const guid = yield { type: 'TestGuid::New' };
  const secret = 'ca_' + guid + '_' + seed;
  return secret;
}
module.exports = { askGenerateSecret };
`;

    const routeSource = `
const { wrapRoute } = require('./wrapperFactory.js');
const { askGenerateSecret } = require('./innerStory.js');
module.exports = { generate: wrapRoute(askGenerateSecret) };
`;

    fs.writeFileSync(path.join(fixtureDirectory, 'wrapperFactory.js'), wrapperFactorySource);
    fs.writeFileSync(path.join(fixtureDirectory, 'innerStory.js'), innerStorySource);
    fs.writeFileSync(path.join(fixtureDirectory, 'route.js'), routeSource);

    const story = fixtureRequire(path.join(fixtureDirectory, 'route.js')).generate;
    const recording = buildRecordedResult(['seed-1'], [{ res: actionResult('guid-9') }]);

    // Deliberately NO scriptPatterns — sibling-directory detection must cover it
    const { trace, replay } = await traceStoryExecution(recording, story);

    expect(replay.result).toEqual({ wrapped: 'ca_guid-9_seed-1' });

    // Both the wrapper's module and the inner story's sibling module were instrumented
    expect(trace.stats.instrumentedScriptUrls?.some((url) => url.includes('wrapperFactory.js'))).toBe(true);
    expect(trace.stats.instrumentedScriptUrls?.some((url) => url.includes('innerStory.js'))).toBe(true);

    // The inner story's statements were recorded — the secret's birth step is findable
    const secretStep = trace.steps.find((step) => step.locals.secret?.preview === '"ca_guid-9_seed-1"');
    expect(secretStep).toBeDefined();
    expect(secretStep?.functionName).toBe('askGenerateSecret');

    // And the wrapper's own statements too
    expect(trace.steps.some((step) => step.functionName === 'wrapper')).toBe(true);
  });

  it('traces code beyond the getPossibleBreakpoints response cap (huge bundle chunks)', async () => {
    // Debugger.getPossibleBreakpoints caps its response (~1000 locations), so on a real
    // bundle chunk a single call covers only the top of the file — code below the cap
    // silently got no breakpoints. Bury the story under enough LIVE statements (exported,
    // so V8 keeps them and reports their positions) to blow the cap and assert the
    // story's steps still get recorded (the worker must paginate).
    const fillerCount = 1500;
    const filler = Array.from({ length: fillerCount }, (_, i) => `function filler${i}() { return ${i}; }`).join('\n');
    const fillerRefs = Array.from({ length: fillerCount }, (_, i) => `filler${i}`).join(',');
    const buriedStorySource = `${filler}
function* askBuried(seed) {
  const guid = yield { type: 'TestGuid::New' };
  const secret = 'ca_' + guid + '_' + seed;
  return secret;
}
module.exports = { askBuried, fillers: [${fillerRefs}] };
`;
    const storyPath = path.join(fixtureDirectory, 'buriedStory.js');
    fs.writeFileSync(storyPath, buriedStorySource);
    const story = fixtureRequire(storyPath).askBuried;

    const recording = buildRecordedResult(['seed-1'], [{ res: actionResult('guid-9') }]);
    const { trace, replay } = await traceStoryExecution(recording, story);

    expect(replay.result).toBe('ca_guid-9_seed-1');
    // Well past a single un-paginated page
    expect(trace.stats.breakpoints).toBeGreaterThan(1500);

    const secretStep = trace.steps.find((step) => step.locals.secret?.preview === '"ca_guid-9_seed-1"');
    expect(secretStep).toBeDefined();
    expect(secretStep?.functionName).toBe('askBuried');
  });

  it('maps steps back to original TypeScript lines and content via source maps', async () => {
    const mappedStoryTs = [
      'export function* askDouble(seed: number): Generator<any, number, any> {',
      "  const bonus: number = yield { type: 'TestBonus::Get' };",
      '  const total = seed * 2 + bonus;',
      '  return total;',
      '}',
      '',
    ].join('\n');

    const transpiled = ts.transpileModule(mappedStoryTs, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        sourceMap: true,
        inlineSources: true,
      },
      fileName: 'mappedStory.ts',
    });

    fs.writeFileSync(path.join(fixtureDirectory, 'mappedStory.js'), transpiled.outputText);
    fs.writeFileSync(path.join(fixtureDirectory, 'mappedStory.js.map'), transpiled.sourceMapText!);

    const story = fixtureRequire(path.join(fixtureDirectory, 'mappedStory.js')).askDouble;
    const recording = buildRecordedResult([10], [{ res: actionResult(5) }]);

    const { trace, replay } = await traceStoryExecution(recording, story);

    expect(replay.result).toBe(25);

    // Steps resolve to the ORIGINAL .ts source, with its content embedded from the map
    const tsSourceIndex = trace.sources.findIndex((source) => source.path.endsWith('mappedStory.ts'));
    expect(tsSourceIndex).toBeGreaterThanOrEqual(0);
    expect(trace.sources[tsSourceIndex].content).toContain('const total = seed * 2 + bonus;');

    // `const total = ...` is line 3 (1-based) of the original TS
    const totalLine = 3;
    const totalStep = trace.steps.find((step) => step.sourceIndex === tsSourceIndex && step.line === totalLine);
    expect(totalStep).toBeDefined();
    expect(totalStep?.locals.bonus?.preview).toBe('5');
    expect(totalStep?.locals.seed?.preview).toBe('10');

    // And after that statement executes, total appears with its computed value
    expect(trace.steps.some((step) => step.locals.total?.preview === '25')).toBe(true);
  });
});
