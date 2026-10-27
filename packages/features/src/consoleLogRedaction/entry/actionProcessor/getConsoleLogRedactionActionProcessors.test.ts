import { buildTestQpqConfig, DecomposedString, DynamicModuleLoader, LogActionType, LogLevelEnum, resolveActionResult } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { REDACTED_STRING } from '../../../admin/log/logic/redaction/constants/REDACTED_STRING';
import { getConsoleLogRedactionActionProcessors } from './getConsoleLogRedactionActionProcessors';

const loader = (async () => undefined) as unknown as DynamicModuleLoader;

type AnyProcessor = (payload: any, ...rest: any[]) => Promise<any>;

const resolve = async (actionType: LogActionType) =>
  (await getConsoleLogRedactionActionProcessors(buildTestQpqConfig(), loader))[actionType] as AnyProcessor;

describe('getConsoleLogRedactionActionProcessors', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers both askLog console processors', async () => {
    const processors = await getConsoleLogRedactionActionProcessors(buildTestQpqConfig(), loader);

    expect(Object.keys(processors).sort()).toEqual([LogActionType.Create, LogActionType.TemplateLiteral].sort());
  });

  it('redacts the data and sweeps its secrets from the message before printing', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolve(LogActionType.Create);

    const result = await processor({ logLevel: LogLevelEnum.Info, msg: 'session for joe is tok-abc', data: { user: 'joe', token: 'tok-abc' } });

    expect(log).toHaveBeenCalledWith(`${LogLevelEnum.Info}: session for joe is ${REDACTED_STRING}`, { user: 'joe', token: REDACTED_STRING });
    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('prints the message alone when there is no data, and keeps falsy data', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolve(LogActionType.Create);

    await processor({ logLevel: LogLevelEnum.Info, msg: 'hello' });
    await processor({ logLevel: LogLevelEnum.Info, msg: 'count', data: 0 });

    expect(log).toHaveBeenNthCalledWith(1, `${LogLevelEnum.Info}: hello`);
    expect(log).toHaveBeenNthCalledWith(2, `${LogLevelEnum.Info}: count`, 0);
  });

  it('redacts interpolated values in a template literal log before composing it', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolve(LogActionType.TemplateLiteral);
    const messageParts: DecomposedString = [['creds ', ' sent tok-abc'], [{ user: 'joe', token: 'tok-abc' }]];

    await processor({ messageParts });

    const [printed] = log.mock.calls[0] as [string];
    expect(printed).toContain(REDACTED_STRING);
    expect(printed).not.toContain('tok-abc');
  });
});
