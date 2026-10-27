import {
  actionResult,
  isErroredActionResult,
  QpqExecutionTrace,
  QpqRuntimeType,
  resolveActionResult,
  resolveActionResultError,
  StoryResult,
  SystemActionType,
} from 'quidproquo-core';

import * as fs from 'fs';
import { createRequire } from 'module';
import * as os from 'os';
import * as path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { getSystemTraceStoryActionProcessor } from './getSystemTraceStoryActionProcessor';

const fixtureDirectory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-trace-processor-test-')));
const fixtureRequire = createRequire(path.join(fixtureDirectory, 'index.js'));

afterAll(() => {
  fs.rmSync(fixtureDirectory, { recursive: true, force: true });
});

const storySource = `
function* askAddTax(amount) {
  const rate = yield { type: 'Tax::GetRate' };
  const total = amount * (1 + rate);
  return total;
}
module.exports = { askAddTax };
`;

const buildRecordedResult = (): StoryResult<any> => ({
  input: [100],
  session: { depth: 0, context: {} },
  history: [{ res: actionResult(0.5) }] as any,
  startedAt: '2024-01-01T00:00:00.000Z',
  finishedAt: '2024-01-01T00:00:00.000Z',
  tags: [],
  moduleName: 'test-module',
  correlation: 'corr-proc-1',
  runtimeType: QpqRuntimeType.UNIT_TEST,
  qpqFunctionRuntimeInfo: '/stories/addTax::askAddTax',
});

const runProcessor = async (storyResult: StoryResult<any>, dynamicModuleLoader: any) => {
  const processors = await getSystemTraceStoryActionProcessor()({} as any, dynamicModuleLoader);
  const processor = processors[SystemActionType.TraceStory];

  return processor(
    { storyResult } as any,
    { depth: 0, context: {} } as any,
    processors,
    undefined as any,
    undefined as any,
    dynamicModuleLoader,
    undefined as any,
  );
};

describe('getSystemTraceStoryActionProcessor', () => {
  it('loads the story through the dynamic module loader and returns its trace', async () => {
    const storyPath = path.join(fixtureDirectory, 'addTax.js');
    fs.writeFileSync(storyPath, storySource);

    const dynamicModuleLoader = async (runtime: any) => {
      expect(runtime).toBe('/stories/addTax::askAddTax');
      return fixtureRequire(storyPath).askAddTax;
    };

    const result = await runProcessor(buildRecordedResult(), dynamicModuleLoader);

    expect(isErroredActionResult(result)).toBe(false);
    const trace = resolveActionResult<QpqExecutionTrace>(result);
    expect(trace.correlation).toBe('corr-proc-1');
    expect(trace.steps.length).toBeGreaterThan(0);
    expect(trace.steps.some((step) => step.locals.total?.preview === '150')).toBe(true);
  });

  it('errors when the log has no runtime info', async () => {
    const storyResult = { ...buildRecordedResult(), qpqFunctionRuntimeInfo: undefined };

    const result = await runProcessor(storyResult, async () => null);

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorText).toContain('no qpqFunctionRuntimeInfo');
  });

  it('errors when the story cannot be loaded', async () => {
    const result = await runProcessor(buildRecordedResult(), async () => null);

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorText).toContain('Unable to dynamically load');
  });
});
