import { QPQConfig } from '../../../QPQConfig';
import { QueueQPQConfigSetting } from '../types';
import { getQueueByName } from './getQueueByName';

export const resolveQueueOrThrow = (name: string, qpqConfig: QPQConfig): QueueQPQConfigSetting => {
  const queue = getQueueByName(name, qpqConfig);

  if (!queue) {
    throw new Error(`No queue config setting found for queue [${name}]`);
  }

  return queue;
};
