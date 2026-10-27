import { buildTestQpqConfig, MetricActionType, MetricUnit, resolveActionResult } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getMetricPutActionProcessor } from './getMetricPutActionProcessor';

describe('getMetricPutActionProcessor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const resolve = async () =>
    (await getMetricPutActionProcessor(buildTestQpqConfig(), async () => null))[MetricActionType.Put] as (p: any, ...rest: any[]) => Promise<any>;

  it('logs the metric name and value and succeeds', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolve();

    const result = await processor({ metricName: 'templateGenerated', value: 3 }, undefined as any);

    expect(log).toHaveBeenCalledWith('metric: templateGenerated=3');
    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('appends the unit when provided', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolve();

    await processor({ metricName: 'renderTime', value: 120, unit: MetricUnit.milliseconds }, undefined as any);

    expect(log).toHaveBeenCalledWith('metric: renderTime=120 Milliseconds');
  });
});
