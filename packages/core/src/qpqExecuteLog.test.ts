import { describe, expect, it } from 'vitest';

import { actionResult } from './logic/actionLogic';
import { AskResponse, QpqRuntimeType, StoryResult } from './types/StorySession';
import { createDebugLogActionProcessor, qpqExecuteLog } from './qpqExecuteLog';

const buildRecordedResult = (history: Array<{ res: any }>): StoryResult<any> => ({
  input: ['seed'],
  session: { depth: 0, context: {} },
  history: history as any,
  startedAt: '2024-01-01T00:00:00.000Z',
  finishedAt: '2024-01-01T00:00:00.000Z',
  tags: [],
  moduleName: 'test-module',
  correlation: 'corr-1',
  fromCorrelation: 'corr-0',
  runtimeType: QpqRuntimeType.UNIT_TEST,
});

describe('createDebugLogActionProcessor', () => {
  it('returns undefined for the then property', async () => {
    const resolver = createDebugLogActionProcessor(buildRecordedResult([]));
    const proxy = await resolver({} as any);

    expect((proxy as any).then).toBeUndefined();
  });

  it('replays recorded history results in sequence', async () => {
    const resolver = createDebugLogActionProcessor(buildRecordedResult([{ res: actionResult('one') }, { res: actionResult('two') }]));
    const proxy = await resolver({} as any);

    expect(
      await proxy.Anything(undefined as any, undefined as any, proxy, undefined as any, undefined as any, undefined as any, undefined as any),
    ).toEqual(actionResult('one'));
    expect(
      await proxy.Anything(undefined as any, undefined as any, proxy, undefined as any, undefined as any, undefined as any, undefined as any),
    ).toEqual(actionResult('two'));
  });

  it('uses an override processor when one is present', async () => {
    const override = async () => actionResult('overridden');
    const resolver = createDebugLogActionProcessor(buildRecordedResult([{ res: actionResult('recorded') }]), { Special: override });
    const proxy = await resolver({} as any);

    expect(proxy.Special).toBe(override);
  });
});

describe('qpqExecuteLog', () => {
  it('replays a recorded story so it sees the recorded action results', async () => {
    const storyResult = buildRecordedResult([{ res: actionResult('recorded-1') }, { res: actionResult('recorded-2') }]);

    function* story(seed: string): AskResponse<string> {
      const a: string = yield { type: 'A' };
      const b: string = yield { type: 'B' };
      return `${seed}:${a}:${b}`;
    }

    const result = await qpqExecuteLog(storyResult, story);

    expect(result.result).toBe('seed:recorded-1:recorded-2');
  });
});
