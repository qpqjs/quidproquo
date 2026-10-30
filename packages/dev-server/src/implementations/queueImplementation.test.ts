import { defineEventBus, defineQueue, EventBusActionType, QueueActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { eventBus, processEvent } from '../logic';
import { queueImplementation } from './queueImplementation';

vi.mock('../logic', async (importOriginal: () => Promise<unknown>) => ({
  // The concurrency gate is real: the per-queue cap test needs it to actually gate.
  ...((await importOriginal()) as typeof import('../logic')),
  eventBus: { on: vi.fn(), publish: vi.fn() },
  processEvent: vi.fn(),
  // Passthrough: the in-flight registry has its own tests, and what this file
  // cares about is that tracking does not disturb the FIFO group chaining.
  trackInFlight: <T>(work: T): T => work,
}));

const buildDevServerConfig = (settings: any[] = []): any => ({
  qpqConfigs: [buildTestQpqConfig(settings)],
  dynamicModuleLoader: vi.fn(),
});

// Registers the implementation (it never resolves) and returns the handler for the action type
const startImplementation = (actionType: string = QueueActionType.SendMessage, settings: any[] = []) => {
  queueImplementation(buildDevServerConfig(settings));

  const call = vi.mocked(eventBus.on).mock.calls.find(([type]: any[]) => type === actionType)!;
  return call[1] as (payload: any, correlation: string) => Promise<void>;
};

const buildPayload = (overrides: Record<string, unknown>): any => ({
  type: 'x',
  payload: {},
  storySession: {},
  queueName: 'fifoQueue',
  targetApplication: 'test-app',
  targetEnvironment: 'development',
  targetModule: 'test-module',
  messageId: 'm',
  ...overrides,
});

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('queueImplementation FIFO group serialization', () => {
  const started: string[] = [];
  const gates: Map<string, ReturnType<typeof deferred>> = new Map();

  beforeEach(() => {
    vi.clearAllMocks();
    started.length = 0;
    gates.clear();

    vi.mocked(processEvent).mockImplementation(async (payload: any) => {
      started.push(payload.messageId);
      const gate = deferred();
      gates.set(payload.messageId, gate);
      return gate.promise;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('processes messages in the same group one at a time, in order', async () => {
    const handler = startImplementation();

    const first = handler(buildPayload({ messageId: 'a1', groupId: 'A' }), 'corr');
    const second = handler(buildPayload({ messageId: 'a2', groupId: 'A' }), 'corr');

    await flush();
    expect(started).toEqual(['a1']);

    gates.get('a1')!.resolve();
    await flush();
    expect(started).toEqual(['a1', 'a2']);

    gates.get('a2')!.resolve();
    await Promise.all([first, second]);
  });

  it('processes different groups concurrently', async () => {
    const handler = startImplementation();

    const first = handler(buildPayload({ messageId: 'a1', groupId: 'A' }), 'corr');
    const second = handler(buildPayload({ messageId: 'b1', groupId: 'B' }), 'corr');

    await flush();
    expect(started).toEqual(['a1', 'b1']);

    gates.get('a1')!.resolve();
    gates.get('b1')!.resolve();
    await Promise.all([first, second]);
  });

  it('processes ungrouped messages concurrently', async () => {
    const handler = startImplementation();

    const first = handler(buildPayload({ messageId: 'm1' }), 'corr');
    const second = handler(buildPayload({ messageId: 'm2' }), 'corr');

    await flush();
    expect(started).toEqual(['m1', 'm2']);

    gates.get('m1')!.resolve();
    gates.get('m2')!.resolve();
    await Promise.all([first, second]);
  });

  it('serialises ungrouped messages on a queue capped at one concurrent execution', async () => {
    const handler = startImplementation(QueueActionType.SendMessage, [defineQueue('serialQueue', {}, { maxConcurrentExecutions: 1 })]);

    const first = handler(buildPayload({ messageId: 'm1', queueName: 'serialQueue' }), 'corr');
    const second = handler(buildPayload({ messageId: 'm2', queueName: 'serialQueue' }), 'corr');

    await flush();
    expect(started).toEqual(['m1']);

    gates.get('m1')!.resolve();
    await first;
    await flush();
    expect(started).toEqual(['m1', 'm2']);

    gates.get('m2')!.resolve();
    await second;
  });

  it('continues the group after a failed message', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = startImplementation();

    const first = handler(buildPayload({ messageId: 'a1', groupId: 'A' }), 'corr');
    const second = handler(buildPayload({ messageId: 'a2', groupId: 'A' }), 'corr');

    await flush();
    gates.get('a1')!.reject(new Error('boom'));
    await flush();

    expect(started).toEqual(['a1', 'a2']);
    expect(consoleError).toHaveBeenCalledTimes(1);

    gates.get('a2')!.resolve();
    await Promise.all([first, second]);
  });
});

describe('queueImplementation retries', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  const retrySettings = [defineQueue('retryQueue', {}, { maxTries: 3, ttRetryInSeconds: 0 })];

  it('redelivers a thrown failure up to maxTries and stops once it succeeds', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let tries = 0;
    vi.mocked(processEvent).mockImplementation(async () => {
      tries += 1;
      if (tries < 3) throw new Error('boom');
      return {} as any;
    });

    const handler = startImplementation(QueueActionType.SendMessage, retrySettings);
    await handler(buildPayload({ messageId: 'r1', queueName: 'retryQueue' }), 'corr');

    expect(tries).toBe(3);
    expect(consoleWarn).toHaveBeenCalledTimes(2);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('treats a failed story result as a failure, and drops the message after the last try', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(processEvent).mockResolvedValue({ error: { errorType: 'GenericError', errorText: 'story failed' } } as any);

    const handler = startImplementation(QueueActionType.SendMessage, retrySettings);
    await handler(buildPayload({ messageId: 'r2', queueName: 'retryQueue' }), 'corr');

    expect(processEvent).toHaveBeenCalledTimes(3);
    expect(consoleWarn).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(String(consoleError.mock.calls[0]?.[0])).toContain('no local dead-letter queue');
  });

  it('delivers once when the queue is unknown to the config', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(processEvent).mockRejectedValue(new Error('boom'));

    const handler = startImplementation();
    await handler(buildPayload({ messageId: 'r3' }), 'corr');

    expect(processEvent).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});

describe('queueImplementation event bus fan-out', () => {
  beforeEach(() => vi.clearAllMocks());

  const fifoSettings = [
    defineEventBus('fifoBus', { isFifo: true }),
    defineQueue('fifoQueue', {}, { isFifo: true, eventBusSubscriptions: ['fifoBus'] }),
  ];

  const buildBusMessage = (overrides: Record<string, unknown> = {}): any => ({
    type: 'x',
    payload: { a: 1 },
    storySession: {},
    eventBusName: 'fifoBus',
    targetApplication: 'test-app',
    targetEnvironment: 'development',
    targetModule: 'test-module',
    ...overrides,
  });

  it('carries the bus message groupId through to a subscribed FIFO queue', async () => {
    const handler = startImplementation(EventBusActionType.SendMessage, fifoSettings);

    await handler(buildBusMessage({ groupId: 'user-42' }), 'corr');

    expect(eventBus.publish).toHaveBeenCalledWith(
      QueueActionType.SendMessage,
      expect.objectContaining({
        queueName: 'fifoQueue',
        groupId: 'user-42',
      }),
    );
  });

  it('leaves groupId unset when the subscribed queue is not FIFO', async () => {
    const handler = startImplementation(EventBusActionType.SendMessage, [
      defineEventBus('bus'),
      defineQueue('plainQueue', {}, { eventBusSubscriptions: ['bus'] }),
    ]);

    await handler(buildBusMessage({ eventBusName: 'bus' }), 'corr');

    expect(eventBus.publish).toHaveBeenCalledWith(
      QueueActionType.SendMessage,
      expect.objectContaining({
        queueName: 'plainQueue',
        groupId: undefined,
      }),
    );
  });

  it('rejects at startup when a FIFO queue subscribes to a standard bus', async () => {
    const badConfig = buildDevServerConfig([defineEventBus('bus'), defineQueue('fifoQueue', {}, { isFifo: true, eventBusSubscriptions: ['bus'] })]);

    await expect(queueImplementation(badConfig)).rejects.toThrow('queue [fifoQueue] -> event bus [bus]');
  });
});
