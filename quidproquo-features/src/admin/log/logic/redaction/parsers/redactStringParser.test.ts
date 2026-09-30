import { GuidActionType, LogActionType, SystemActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { redactStoryResult } from '../redactStoryResult';
import { redactStringParser } from './redactStringParser';

const mark = (value: unknown) => ({ act: { type: LogActionType.RedactString, payload: { value } }, res: [undefined, undefined] });

describe('redactStringParser', () => {
  it('reports every value marked with askRedactString', () => {
    const log = {
      correlation: 'c1',
      history: [mark('first-secret'), { act: { type: 'Log/Create', payload: { msg: 'hi' } }, res: [undefined, undefined] }, mark('second-secret')],
    } as any;

    expect(redactStringParser(log).redactions).toEqual(['first-secret', 'second-secret']);
  });

  it('finds marks inside batched actions', () => {
    const log = {
      correlation: 'c1',
      history: [
        {
          act: { type: SystemActionType.Batch, payload: { actions: [{ type: LogActionType.RedactString, payload: { value: 'batched-secret' } }] } },
          res: [[undefined], undefined],
        },
      ],
    } as any;

    expect(redactStringParser(log).redactions).toEqual(['batched-secret']);
  });

  it('ignores a mark without a string value, and a log without history', () => {
    expect(redactStringParser({ correlation: 'c1', history: [mark(undefined), mark(42)] } as any).redactions).toEqual([]);
    expect(redactStringParser({ correlation: 'c1' } as any).redactions).toEqual([]);
  });

  it('leaves the log itself unchanged (the sweep does the removing)', () => {
    const log = { correlation: 'c1', history: [mark('a-secret')] } as any;

    expect(redactStringParser(log).redactedLog).toBe(log);
  });

  it('through the pipeline, removes a marked token and the GUIDs it was built from, everywhere', () => {
    const first = '4f7a1c2e-9b8d-4e6f-a1b2-c3d4e5f60718';
    const second = '293a4b5c-6d7e-4f90-a1b2-c3d4e5f60718';
    const token = `${first}${second}`.replace(/-/g, '');
    const log = {
      correlation: 'c1',
      history: [
        { act: { type: GuidActionType.New }, res: [first, undefined] },
        { act: { type: GuidActionType.New }, res: [second, undefined] },
        mark(first),
        mark(second),
        mark(token),
        { act: { type: 'Comms/SendEmail', payload: { bodyText: `Your code is ${token}` } }, res: [undefined, undefined] },
      ],
    } as any;

    const redacted = JSON.stringify(redactStoryResult(log));

    expect(redacted).not.toContain(token);
    expect(redacted).not.toContain(first);
    expect(redacted).not.toContain(second);
  });
});
