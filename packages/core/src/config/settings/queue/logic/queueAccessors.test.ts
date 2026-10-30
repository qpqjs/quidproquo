import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineQueue } from '../defineQueue';
import { getAllQueueConfigs } from './getAllQueueConfigs';
import { getOwnedQueueConfigs } from './getOwnedQueueConfigs';
import { getQueueByName } from './getQueueByName';
import { resolveQueueOrThrow } from './resolveQueueOrThrow';

const config = [
  defineApplication('app', 'production', 'root'),
  defineModule('svc'),
  defineQueue('jobs', { created: '/q/created::run' }),
  defineQueue('mail', {}),
];

describe('queue accessors', () => {
  it('lists every queue and the owned ones (queues carry no owner, so all are owned)', () => {
    expect(getAllQueueConfigs(config).map((queue) => queue.name)).toEqual(['jobs', 'mail']);
    expect(getOwnedQueueConfigs(config).map((queue) => queue.name)).toEqual(['jobs', 'mail']);
  });

  it('finds a queue by name, null when unknown', () => {
    expect(getQueueByName('jobs', config)?.qpqQueueProcessors).toEqual({ created: '/q/created::run' });
    expect(getQueueByName('missing', config)).toBeNull();
  });

  it('resolves a queue by name or throws naming it', () => {
    expect(resolveQueueOrThrow('mail', config).name).toBe('mail');
    expect(() => resolveQueueOrThrow('missing', config)).toThrow('No queue config setting found for queue [missing]');
  });
});
