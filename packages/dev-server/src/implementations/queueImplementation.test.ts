import { buildTestQpqConfig, defineEventBus, defineQueue, EventBusActionType, QueueActionType } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { eventBus, processEvent } from '../logic';
import { queueImplementation } from './queueImplementation';

vi.mock('../logic', () => ({
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
const startImplementation = (actionType: string = QueueActionType.SendMessages, settings: any[] = []) => {
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
    const handler = startImplementation(EventBusActionType.SendMessages, fifoSettings);

    await handler(buildBusMessage({ groupId: 'user-42' }), 'corr');

    expect(eventBus.publish).toHaveBeenCalledWith(
      QueueActionType.SendMessages,
      expect.objectContaining({
        queueName: 'fifoQueue',
        groupId: 'user-42',
      }),
    );
  });

  it('leaves groupId unset when the subscribed queue is not FIFO', async () => {
    const handler = startImplementation(EventBusActionType.SendMessages, [
      defineEventBus('bus'),
      defineQueue('plainQueue', {}, { eventBusSubscriptions: ['bus'] }),
    ]);

    await handler(buildBusMessage({ eventBusName: 'bus' }), 'corr');

    expect(eventBus.publish).toHaveBeenCalledWith(
      QueueActionType.SendMessages,
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
