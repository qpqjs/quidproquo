import { ActionProcessorList } from 'quidproquo-core';

import { DevServerDelayConfig } from '../types';

export const resolveDelayMs = (delay: DevServerDelayConfig | undefined, actionType: string): number => {
  if (delay === undefined) return 0;
  if (typeof delay === 'number') return delay;
  return delay[actionType] ?? delay.default ?? 0;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const delayForAction = async (delay: DevServerDelayConfig | undefined, actionType: string): Promise<void> => {
  const ms = resolveDelayMs(delay, actionType);
  if (ms > 0) await sleep(ms);
};

export const withProcessorDelay = (processors: ActionProcessorList, delay: DevServerDelayConfig | undefined): ActionProcessorList => {
  if (delay === undefined) return processors;

  return Object.fromEntries(
    Object.entries(processors).map(([actionType, processor]) => {
      const ms = resolveDelayMs(delay, actionType);
      if (!ms) return [actionType, processor];
      const wrapped: typeof processor = async (...args) => {
        await sleep(ms);
        return processor(...args);
      };
      return [actionType, wrapped];
    }),
  );
};
