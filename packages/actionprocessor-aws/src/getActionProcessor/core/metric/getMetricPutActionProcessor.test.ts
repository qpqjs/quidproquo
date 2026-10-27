import { buildTestQpqConfig, MetricActionType, MetricUnit } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getMetricPutActionProcessor } from './getMetricPutActionProcessor';

const resolveProcessor = async () => {
  const processors = await getMetricPutActionProcessor(buildTestQpqConfig(), {} as any);
  return processors[MetricActionType.Put];
};

const getLoggedEmf = (logSpy: ReturnType<typeof vi.spyOn>): any => JSON.parse(logSpy.mock.calls[0][0] as string);

describe('getMetricPutActionProcessor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits a CloudWatch EMF log line with standard dimensions and the metric value', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolveProcessor();

    await invokeProcessor(processor, { metricName: 'templateGenerated', value: 3, unit: MetricUnit.milliseconds, dimensions: { kind: 'docx' } });

    const emf = getLoggedEmf(logSpy);
    expect(emf._aws.CloudWatchMetrics).toEqual([
      {
        Namespace: 'qpq/test-app/development',
        Dimensions: [['service', 'kind']],
        Metrics: [{ Name: 'templateGenerated', Unit: 'Milliseconds' }],
      },
    ]);
    expect(emf.service).toBe('test-module');
    expect(emf.kind).toBe('docx');
    expect(emf.templateGenerated).toBe(3);
    expect(typeof emf._aws.Timestamp).toBe('number');
  });

  it('defaults the unit to Count with the service dimension', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolveProcessor();

    await invokeProcessor(processor, { metricName: 'signIn', value: 1 });

    const emf = getLoggedEmf(logSpy);
    expect(emf._aws.CloudWatchMetrics[0].Metrics).toEqual([{ Name: 'signIn', Unit: 'Count' }]);
    expect(emf._aws.CloudWatchMetrics[0].Dimensions).toEqual([['service']]);
  });

  it('namespaces feature deployments separately (per-developer sandboxes)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processors = await getMetricPutActionProcessor(buildTestQpqConfig([], { feature: 'jane' }), {} as any);

    await invokeProcessor(processors[MetricActionType.Put], { metricName: 'signIn', value: 1 });

    const emf = getLoggedEmf(logSpy);
    expect(emf._aws.CloudWatchMetrics[0].Namespace).toBe('qpq/test-app/development/jane');
    expect(emf._aws.CloudWatchMetrics[0].Dimensions).toEqual([['service']]);
  });
});
