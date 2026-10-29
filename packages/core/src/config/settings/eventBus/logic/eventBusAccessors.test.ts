import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineEventBus } from '../defineEventBus';
import { getAllEventBusConfigs } from './getAllEventBusConfigs';
import { getEventBusByName } from './getEventBusByName';
import { getOwnedEventBusConfigs } from './getOwnedEventBusConfigs';
import { resolveEventBusOrThrow } from './resolveEventBusOrThrow';

const config = [
  defineApplication('app', 'root'),
  defineModule('svc'),
  defineEventBus('mine'),
  defineEventBus('local', { owner: { module: 'other', eventBusName: 'sharedBus' } }),
];

describe('event bus accessors', () => {
  it('lists every bus, and only the owned ones', () => {
    expect(getAllEventBusConfigs(config).map((bus) => bus.name)).toEqual(['mine', 'local']);
    expect(getOwnedEventBusConfigs(config).map((bus) => bus.name)).toEqual(['mine']);
  });

  it('finds a bus by its published resource name or its own name, null when unknown', () => {
    expect(getEventBusByName('sharedBus', config)?.name).toBe('local');
    expect(getEventBusByName('local', config)?.name).toBe('local');
    expect(getEventBusByName('missing', config)).toBeNull();
  });

  it('resolves a bus by name or throws naming it', () => {
    expect(resolveEventBusOrThrow('mine', config).name).toBe('mine');
    expect(() => resolveEventBusOrThrow('missing', config)).toThrow('Event bus [missing] not found');
  });
});
