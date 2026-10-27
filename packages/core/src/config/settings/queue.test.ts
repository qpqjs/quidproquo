import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineQueue } from './queue';

describe('defineQueue', () => {
  const processors = { 'Demo/Job': '/entry/queue::onJob' as const };

  it('builds a Queue setting with the given name, processors and defaults', () => {
    expect(defineQueue('Jobs', processors)).toEqual({
      configSettingType: QPQCoreConfigSettingType.queue,
      uniqueKey: 'Jobs',
      name: 'Jobs',
      batchSize: 0,
      batchWindowInSeconds: 0,
      concurrency: 1,
      maxTries: 1,
      ttRetryInSeconds: 15 * 60,
      hasDeadLetterQueue: true,
      qpqQueueProcessors: processors,
      eventBusSubscriptions: [],
      maxConcurrentExecutions: undefined,
      isFifo: false,
    });
  });

  it('honours an explicit zero batching window', () => {
    // Regression: this used to be `|| 5`, so 0 was falsy and a caller asking for no window silently got 5 —
    // the setting could not be turned off at all.
    expect(defineQueue('Jobs', processors, { batchWindowInSeconds: 0 }).batchWindowInSeconds).toBe(0);
  });

  it('still honours an explicit window for a queue that wants to accumulate', () => {
    expect(defineQueue('Jobs', processors, { batchWindowInSeconds: 20 }).batchWindowInSeconds).toBe(20);
  });

  it('caps ttRetryInSeconds at 15 minutes', () => {
    expect(defineQueue('Jobs', processors, { ttRetryInSeconds: 99999 }).ttRetryInSeconds).toBe(15 * 60);
  });

  it('applies supplied batching options', () => {
    const setting = defineQueue('Jobs', processors, { batchSize: 10, concurrency: 4, eventBusSubscriptions: ['bus'] });

    expect(setting.batchSize).toBe(10);
    expect(setting.concurrency).toBe(4);
    expect(setting.eventBusSubscriptions).toEqual(['bus']);
  });

  it('applies isFifo when supplied', () => {
    expect(defineQueue('Jobs', processors, { isFifo: true }).isFifo).toBe(true);
  });

  it('lets hasDeadLetterQueue be turned off', () => {
    // Regression: `|| true` used to swallow an explicit false
    expect(defineQueue('Jobs', processors, { hasDeadLetterQueue: false }).hasDeadLetterQueue).toBe(false);
  });

  it('passes maxConcurrentExecutions through', () => {
    expect(defineQueue('Jobs', processors, { maxConcurrentExecutions: 3 }).maxConcurrentExecutions).toBe(3);
  });
});
